<template>
    <TokenActionPanel
        title="Gas fee balance"
        tokenSymbol="$GALA"
        :tokenImage="galaTokenImage"
        :showStatusIndicator="hasMissingGasBalance"
        statusText="MISSING BALANCE"
        actionButtonText="Transfer Token"
        :actionDisabled="!hasMissingGasBalance || giveawayTokenBalances === undefined"
        @action-click="transferToken"
    >
        <template #content>
            <div class="balance-info">
                <div class="balance-item">
                    <div class="balance-label">REQUIRED BALANCE</div>
                    <div class="balance-value">{{ formatNumber(Number(giveawayStore.estimateGalaFees())) }}</div>
                </div>
                <div class="balance-item">
                    <div class="balance-label">YOUR BALANCE</div>
                    <div v-if="giveawayTokenBalances !== undefined" class="balance-value">
                        {{ formatNumber(Number(giveawayTokenBalances.galaBalance || 0)) }}
                    </div>
                    <div v-else class="loading-spinner"></div>
                </div>
                <div class="balance-item">
                    <div class="balance-label">MISSING BALANCE</div>
                    <div v-if="giveawayTokenBalances !== undefined" class="balance-value">
                        {{ formatNumber(Number(missingGasBalance)) }}
                    </div>
                    <div v-else class="loading-spinner"></div>
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
import { isErrorWithMessage } from '@/utils/Helpers';
import { useProfileStore } from '@/stores/profile';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';
import { formatNumber } from '@/utils/Helpers';
import { GALA } from '@/utils/constants';
import BigNumber from 'bignumber.js';
import type { GiveawaySettingsDto } from '@/utils/types';
import TokenActionPanel from './TokenActionPanel.vue';
import galaTokenImage from '@/assets/gala-token.png';

const props = defineProps<{
    giveawaySettings: GiveawaySettingsDto;
}>();

const profileStore = useProfileStore();
const giveawayStore = useCreateGiveawayStore();
const { profile, giveawayTokenBalances } = storeToRefs(profileStore);
const { showToast } = useToast();

const missingGasBalance = computed(() => {
    return BigNumber.max(0, giveawayStore.estimateGalaFees().minus(giveawayTokenBalances.value?.galaBalance || 0));
});

const hasMissingGasBalance = computed(() => missingGasBalance.value.gt(0));

async function transferToken() {
    const browserClient = new BrowserConnectClient();
    await browserClient.connect();

    const tokenService = GalaChainApi.getInstance();

    if (!profile.value || !profile.value.giveawayWalletAddress) {
        showToast(`Unable to get giveaway wallet`, true);
        return;
    }

    await tokenService.init();
    try {
        const grant = await tokenService.transferToken(
            GALA,
            missingGasBalance.value.toString(),
            profile.value.giveawayWalletAddress
        );

        if (grant.Status === 1) {
            await profileStore.refreshGiveawayTokenBalances(props.giveawaySettings.giveawayToken);
            showToast('Gas tokens transferred successfully!');
            emit('token-transferred');
        }
    } catch (e: unknown) {
        let errorMessage = 'unknown error';
        if (isErrorWithMessage(e)) {
            errorMessage = e.Message;
        }
        console.error(errorMessage);
        showToast(`Unable to transfer gas tokens. Error: ${errorMessage}`, true);
    }
}

const emit = defineEmits<{
    (e: 'token-transferred'): void;
}>();

// Add computed property to check if gas requirements are met
const gasRequirementsMet = computed(() => {
    return !hasMissingGasBalance.value;
});

// Add watcher to emit status changes to parent
watch(gasRequirementsMet, (newValue) => {
    emit('token-transferred');
});

// Emit immediately if requirements are already met on mount
onMounted(() => {
    if (gasRequirementsMet.value) {
        emit('token-transferred');
    }
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
</style>
