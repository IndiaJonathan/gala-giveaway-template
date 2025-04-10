<template>
    <TokenActionPanel title="Gas fee balance" tokenSymbol="$GALA" :tokenImage="galaTokenImage"
        :showStatusIndicator="hasMissingGasBalance" statusText="MISSING BALANCE" actionButtonText="Transfer Token"
        :actionDisabled="!hasMissingGasBalance || balances === undefined" @action-click="transferToken"
        explanatoryText="Gas fees are required to process transactions on the blockchain. Ensure you have sufficient GALA tokens to cover gas fees for your giveaway operations.">
        <template #content>
            <div class="balance-info">
                <div class="balance-item">
                    <div class="balance-label">REQUIRED BALANCE</div>
                    <div class="balance-value">{{ formatNumber(Number(totalRequiredGas)) }}</div>
                </div>
                <div class="balance-item">
                    <div class="balance-label">YOUR NET ESCROW BALANCE</div>
                    <div v-if="balances !== undefined" class="balance-value">
                        {{ formatNumber(netEscrowBalance) }}
                    </div>
                    <div v-else class="loading-spinner"></div>
                </div>
                <div class="balance-item">
                    <div class="balance-label">MISSING ESCROW BALANCE</div>
                    <div v-if="missingGasBalance !== undefined" class="balance-value">
                        {{ formatNumber(Number(missingGasBalance)) }}
                    </div>
                    <div v-else class="loading-spinner"></div>
                </div>
            </div>
            <div v-if="BigNumber(findTokenInArray(balances?.giveawayWalletBalances?.Data, GALA)?.quantity || 0).gt(0)"
                class="fees-breakdown">
                <div class="divider"></div>
                <h3 class="breakdown-title">Fee Breakdown:</h3>
                <div class="breakdown-grid">
                    <div class="breakdown-item">
                        <div class="breakdown-label">Total Gas Fees:</div>
                        <div class="breakdown-value">{{ formatNumber(Number(requiredGas)) }}</div>
                    </div>
                    <div class="breakdown-item">
                        <div class="breakdown-label">Already Accounted Fees:</div>
                        <div class="breakdown-value">{{
                            formatNumber(Number(findTokenInArray(balances?.giveawayWalletBalances?.Data,
                                giveawaySettings.giveawayToken as any)?.quantity || 0)) }}</div>
                    </div>
                </div>
            </div>
        </template>
    </TokenActionPanel>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, watchEffect } from 'vue';
import { useToast } from '@/composables/useToast';
import { GalaChainApi } from '@/services/GalaChainApi';
import { BrowserConnectClient } from '@gala-chain/connect';
import { isErrorWithMessage, findTokenInArray } from '@/utils/Helpers';
import { useProfileStore } from '@/stores/profile';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';
import { formatNumber } from '@/utils/Helpers';
import { GALA } from '@/utils/constants';
import BigNumber from 'bignumber.js';
import type { GiveawaySettingsDto } from '@/utils/types';
import TokenActionPanel from './TokenActionPanel.vue';
import galaTokenImage from '@/assets/gala-token.png';

const profileStore = useProfileStore();
const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings, requiredGas } = storeToRefs(giveawayStore);
const { profile, balances } = storeToRefs(profileStore);
const { showToast } = useToast();

// Calculate actual required gas fees by considering already accounted for fees
const totalRequiredGas = computed(() => {
    const requiredGalaEscrowBalance = findTokenInArray(balances.value?.requiredEscrow.balanceEscrowRequirements, GALA)?.quantity || 0;

    return requiredGas.value.plus(requiredGalaEscrowBalance);
});

const netEscrowBalance = computed(() => {
    const giveawayWalletGalaBalance = new BigNumber(findTokenInArray(balances.value?.giveawayWalletBalances?.Data, GALA)?.quantity || 0);
    return new BigNumber(giveawayWalletGalaBalance.minus(totalRequiredGas.value));
});

const missingGasBalance = computed(() => {
    return BigNumber.max(0, netEscrowBalance.value.multipliedBy(-1));
});

const hasMissingGasBalance = computed(() => missingGasBalance.value.gt(0));

const isValid = computed(() => !hasMissingGasBalance.value);

// Expose isValid property
defineExpose({ isValid });

async function transferToken() {
    const browserClient = new BrowserConnectClient();
    await browserClient.connect();

    const tokenService = GalaChainApi.getInstance();

    if (!profile.value || !profile.value.giveawayWalletAddress) {
        showToast(`Unable to get giveaway wallet`, true);
        return;
    }

    // Cache the missing balance value to avoid reactive dependency
    const missingBalanceAmount = missingGasBalance.value.toString();

    await tokenService.init();
    try {
        const grant = await tokenService.transferToken(
            GALA,
            missingBalanceAmount,
            profile.value.giveawayWalletAddress
        );

        if (grant.Status === 1) {
            showToast('Gas tokens transferred successfully!');

            // Use a slight delay to avoid synchronous reactive update loops
            setTimeout(async () => {
                await profileStore.getBalances();
                emit('token-transferred');
                emit('is-valid', true);
            }, 0);
        }
    } catch (e: any) {
        let errorMessage = e.Message || e.message || 'unknown error';
        console.error(errorMessage);
        if (errorMessage.includes('ACTION_REJECTED')) {
            showToast('Transaction rejected', true);
        } else {
            showToast(`Unable to transfer gas tokens. Error: ${errorMessage}`, true);
        }
    }
}

const emit = defineEmits<{
    (e: 'token-transferred'): void;
    (e: 'is-valid', valid: boolean): void;
}>();

// Watch for changes in validity and emit when requirements are met
watch(isValid, (newValue) => {
    emit('is-valid', newValue);
});

// Initial check when component is mounted
onMounted(() => {
    emit('is-valid', isValid.value);
});
</script>

<style scoped>
.balance-info {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 24px;
    width: 100%;
}

.balance-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.balance-label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
}

.balance-value {
    font-size: 24px;
    font-weight: 600;
    color: #fff;
}

.loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-left-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.fees-breakdown {
    margin-top: 24px;
}

.divider {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
    margin-bottom: 16px;
}

.breakdown-title {
    font-size: 16px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 16px;
}

.breakdown-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
}

.breakdown-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.breakdown-label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
}

.breakdown-value {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
}
</style>
