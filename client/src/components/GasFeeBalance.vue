<template>
    <Collapsible title="Gas fee balance" :collapsible="false" isOpen>
        <p class="explanatory-text mb-8">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur iaculis pharetra
            lectus quis dictum. Etiam vulputate orci vel orci auctor pellentesque.
        </p>

        <div class="token-info">
            <div class="token-section">
                <div class="token-label">TOKEN</div>
                <div class="token-value">
                    <div class="token-icon">
                        <span>$GALA</span>
                    </div>
                </div>
            </div>
            <div v-if="hasMissingGasBalance" class="missing-allowance">MISSING BALANCE</div>
        </div>

        <div class="balance-info">
            <div class="balance-item">
                <div class="balance-label">REQUIRED BALANCE</div>
                <div class="balance-value">{{ formatNumber(Number(estimateGalaFees())) }}</div>
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

        <button class="transfer-token-btn" :disabled="!hasMissingGasBalance || giveawayTokenBalances === undefined" :class="{ 'disabled': !hasMissingGasBalance || giveawayTokenBalances === undefined }" @click="transferToken">
            Transfer Token
        </button>
    </Collapsible>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useToast } from '@/composables/useToast';
import { GalaChainApi } from '@/services/GalaChainApi';
import { BrowserConnectClient } from '@gala-chain/connect';
import { isErrorWithMessage } from '@/utils/Helpers';
import { useProfileStore } from '@/stores/profile';
import { storeToRefs } from 'pinia';
import Collapsible from './Collapsible.vue';
import { formatNumber } from '@/utils/Helpers';
import { GALA } from '@/utils/constants';
import BigNumber from 'bignumber.js';
import type { GiveawaySettingsDto } from '@/utils/types';

const props = defineProps<{
    giveawaySettings: GiveawaySettingsDto;
}>();

const profileStore = useProfileStore();
const { profile, giveawayTokenBalances } = storeToRefs(profileStore);
const { showToast } = useToast();

function estimateGalaFees() {
    if (props.giveawaySettings.giveawayType === 'DistributedGiveaway') {
        return BigNumber(props.giveawaySettings.maxWinners || 1).dividedBy(1000).integerValue(BigNumber.ROUND_CEIL);
    } else if (props.giveawaySettings.giveawayType === 'FirstComeFirstServe') {
        return BigNumber(props.giveawaySettings.maxWinners || 1);
    } else {
        throw new Error(`Unknown giveaway type`);
    }
}

const missingGasBalance = computed(() => {
    return BigNumber.max(0, estimateGalaFees().minus(giveawayTokenBalances.value?.galaBalance || 0));
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
            emit('tokenTransferred');
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
    (e: 'tokenTransferred'): void;
}>();
</script>

<style scoped>
.explanatory-text {
    font-size: 16px;
    font-weight: 400;
    line-height: 20px;
    text-align: left;
    color: rgba(255, 255, 255, 0.6);
}

.mb-8 {
    margin-bottom: 32px;
}

.mb-4 {
    margin-bottom: 16px;
}

.token-info {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    gap: 8px;
    justify-content: space-between;
}

.token-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.token-label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
}

.token-value {
    display: flex;
    align-items: center;
}

.token-icon {
    display: flex;
    align-items: center;
    gap: 8px;
}

.token-icon::before {
    content: "";
    display: inline-block;
    width: 24px;
    height: 24px;
    background: #fff;
    border-radius: 50%;
}

.token-icon span {
    color: #fff;
    font-weight: 500;
}

.missing-allowance {
    display: inline-flex;
    align-items: center;
    background-color: #FF4D4F;
    color: white;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 6px;
    height: fit-content;
}

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

.transfer-token-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #27272A;
    color: white;
    font-size: 16px;
    font-weight: 500;
    padding: 12px 24px;
    border-radius: 100px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    width: fit-content;
    min-width: 180px;
}

.transfer-token-btn:hover:not(.disabled) {
    background-color: #3F3F46;
}

.transfer-token-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

:deep(.collapsible) {
    background: #18181B;
    border-radius: 16px;
    padding: 24px;
}

.explanatory-text {
    font-size: 16px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 32px;
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