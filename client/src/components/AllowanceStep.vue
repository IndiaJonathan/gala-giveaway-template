<template>
    <div>
        <Collapsible title="Giveaway escrow wallet" :collapsible="false" isOpen class="mb-4">
            <p class="explanatory-text mb-8">
                This wallet will securely hold your giveaway tokens until they are claimed by winners. The tokens will
                be automatically distributed to winners based on your giveaway settings.
                You cannot withdraw the tokens from this wallet once sent!
            </p>
            <div class="wallet-address">
                <div class="label">WALLET ADDRESS:</div>
                <div class="address">{{ walletAddress }}</div>
            </div>

        </Collapsible>

        <div v-if="!balances" class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading balance information...</div>
        </div>
        <TokenRequirementCheck v-else ref="tokenRequirementCheck"
            :includeGasFees="isGalaToken && giveawaySettings.giveawayTokenType === GiveawayTokenType.BALANCE"
            @requirement-met="checkValidity" />

        <!-- Only show separate GasFeeBalance if token is not GALA or if using allowance -->
        <GasFeeBalance v-if="!isGalaToken || giveawaySettings.giveawayTokenType === 'Allowance'"
            :giveawaySettings="giveawaySettings as GiveawaySettingsDto" @token-transferred="checkValidity" />
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onMounted, watchEffect } from 'vue';
import Collapsible from './Collapsible.vue';
import { findTokenInArray, formatNumber, isErrorWithMessage } from '@/utils/Helpers';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile';
import BigNumber from 'bignumber.js';
import { useToast } from '@/composables/useToast';
import { GalaChainApi } from '@/services/GalaChainApi';
import { BrowserConnectClient } from '@gala-chain/connect';
import { type GiveawayDetails, type GiveawaySettingsDto, type Profile } from '@/utils/types';
import type { TokenClassKeyProperties } from '@gala-chain/api';
import { GALA } from '@/utils/constants';
import TokenRequirementCheck from './TokenRequirementCheck.vue';
import GasFeeBalance from './GasFeeBalance.vue';
import { GiveawayTokenType } from '@/utils/types';

const emit = defineEmits(['is-valid']);

const tokenRequirementCheck = ref<InstanceType<typeof TokenRequirementCheck> | null>(null);

const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings, requiredTokenAmount,requiredGas } = storeToRefs(giveawayStore);
const profileStore = useProfileStore();
const { profile, balances, connectedEthAddress } = storeToRefs(profileStore);
const { showToast } = useToast();

// Get wallet address from profile store
const walletAddress = computed(() => {
    return profile.value?.giveawayWalletAddress || 'Not connected';
});

// Check if current token is GALA
const isGalaToken = computed(() => {
    if (!giveawaySettings.value.giveawayToken) return false;

    const token = giveawaySettings.value.giveawayToken;
    return token.collection === GALA.collection &&
        token.category === GALA.category &&
        token.type === GALA.type &&
        token.additionalKey === GALA.additionalKey;
});

// Get token details from giveaway settings
const tokenSymbol = computed(() => {
    const token = giveawaySettings.value.giveawayToken;
    if (token) {
        // Use collection name if symbol is not available
        return token.collection?.substring(0, 4) || 'Token';
    }
    return 'Select token';
});

// Use TokenRequirementCheck's isValid property instead of our own implementation
const isValid = computed(() => {
    // If tokenRequirementCheck is not available or if required amount is zero, handle it ourselves
    if (!tokenRequirementCheck.value || requiredTokenAmount.value.isZero()) {
        if (requiredTokenAmount.value.isZero() &&
            (giveawaySettings.value.giveawayTokenType === 'Allowance' ||
                giveawaySettings.value.giveawayTokenType === 'Balance')) {
            return true;
        }
        return false;
    }
    
    // Otherwise use TokenRequirementCheck's isValid
    return tokenRequirementCheck.value.isValid;
});

// Check gas fee requirement
const gasFeesValid = computed(() => {
    // If token is GALA and using Balance, gas fees are already included in isValid check
    if (isGalaToken.value && giveawaySettings.value.giveawayTokenType === 'Balance') {
        return true;
    }

    // Estimate required gas fees, accounting for fees already covered
    const currentGalaFeesNeeded = BigNumber(findTokenInArray(balances.value?.giveawayWalletBalances?.Data, giveawaySettings.value.giveawayToken as any)?.quantity || 0);
    const actualGasFeeNeeded = BigNumber.max(0, requiredGas.value.minus(currentGalaFeesNeeded));

    // Check if gas fee requirement is zero or we have enough balance
    return actualGasFeeNeeded.isZero() ||
        BigNumber(findTokenInArray(balances.value?.availableBalances, giveawaySettings.value.giveawayToken as any)?.quantity || 0).gte(actualGasFeeNeeded);
});

// Combined validation - both token and gas requirements must be met
const allRequirementsMet = computed(() => {
    return isValid.value && gasFeesValid.value;
});

const checkValidity = () => {
    emit('is-valid', allRequirementsMet.value);
};

// Watch for changes in validity
watch([allRequirementsMet], (newValue) => {
    emit('is-valid', newValue[0]);
});

// Fetch allowance data when component is mounted
onMounted(async () => {
    /**
    if (giveawaySettings.value.giveawayToken && profile.value?.galaChainAddress) {
            try {
                // Use the profile store to fetch allowances
                await profileStore.refreshGiveawayTokenBalances(
                    {
                        collection: giveawaySettings.value.giveawayToken?.collection,
                        category: giveawaySettings.value.giveawayToken?.category,
                        type: giveawaySettings.value.giveawayToken?.type,
                        additionalKey: giveawaySettings.value.giveawayToken?.additionalKey
                    } as TokenClassKeyProperties
                );
            } catch (error) {
                console.error('Error fetching allowances:', error);
            }
        }
    
    */

    checkValidity();
});

defineExpose({ isValid: allRequirementsMet });
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

.wallet-address {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}

.label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    margin-right: 8px;
}

.address {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 1);
}

.token-info {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}

.token-label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    margin-right: 8px;
}

.token-value {
    display: flex;
    align-items: center;
}

.token-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #333;
    margin-right: 8px;
    font-size: 12px;
    color: white;
}

.missing-allowance {
    display: inline-block;
    background-color: #FF4D4F;
    color: white;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;
    margin-bottom: 16px;
}

.success-alert {
    background-color: rgba(82, 196, 26, 0.1);
    color: #52c41a;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid rgba(82, 196, 26, 0.2);
}

.text-muted {
    color: rgba(255, 255, 255, 0.6);
}

.balance-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
    width: 100%;
}

.balance-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
}

.balance-label {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
    text-transform: uppercase;
}

.balance-value {
    font-size: 16px;
    font-weight: 600;
    color: rgba(255, 255, 255, 1);
}

.grant-allowance-btn,
.transfer-token-btn {
    display: inline-block;
    background-color: #1E1E1E;
    color: white;
    font-size: 14px;
    font-weight: 500;
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
    width: 100%;
    text-align: center;
}

.grant-allowance-btn:hover:not(.disabled),
.transfer-token-btn:hover:not(.disabled) {
    background-color: #333;
}

.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 0;
    width: 100%;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top-color: rgba(255, 255, 255, 0.8);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
}

.loading-text {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.escrow-info {
    display: flex;
    align-items: center;
    margin-top: 12px;
}
</style>