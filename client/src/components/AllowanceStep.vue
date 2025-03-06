<template>
    <div>
        <Collapsible title="Giveaway escrow wallet" :collapsible="false" isOpen class="mb-4">
            <p class="explanatory-text mb-8">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur iaculis pharetra
                lectus quis dictum. Etiam vulputate orci vel orci auctor pellentesque.
            </p>
            <div class="wallet-address">
                <div class="label">WALLET ADDRESS:</div>
                <div class="address">{{ walletAddress }}</div>
            </div>
        </Collapsible>

        <AllowanceCheck v-if="giveawaySettings.giveawayTokenType === 'Allowance'"
            :giveawaySettings="giveawaySettings as GiveawaySettingsDto" :requiredAmount="requiredBalance"
            :grantedAllowanceQuantity="BigNumber(giveawayTokenBalances?.allowances || 0)"
            @allowance-granted="checkValidity" />

        <BalanceCheck v-else-if="giveawaySettings.giveawayTokenType === 'Balance'"
            :giveawaySettings="giveawaySettings as GiveawaySettingsDto" :requiredAmount="requiredBalance"
            :adminBalanceQuantity="BigNumber(giveawayTokenBalances?.tokenBalance || 0)"
            @token-transferred="checkValidity" />

        <GasFeeBalance :giveawaySettings="giveawaySettings as GiveawaySettingsDto" @token-transferred="checkValidity" />
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onMounted, watchEffect } from 'vue';
import Collapsible from './Collapsible.vue';
import { formatNumber, isErrorWithMessage } from '@/utils/Helpers';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile';
import BigNumber from 'bignumber.js';
import { useToast } from '@/composables/useToast';
import { GalaChainApi } from '@/services/GalaChainApi';
import { BrowserConnectClient } from '@gala-chain/connect';
import { getRequiredAmount, type GiveawayDetails, type GiveawaySettingsDto, type Profile } from '@/utils/types';
import type { TokenClassKeyProperties } from '@gala-chain/api';
import { GALA } from '@/utils/constants';
import AllowanceCheck from './AllowanceCheck.vue';
import BalanceCheck from './BalanceCheck.vue';
import GasFeeBalance from './GasFeeBalance.vue';

const emit = defineEmits(['is-valid']);

const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings } = storeToRefs(giveawayStore);
const profileStore = useProfileStore();
const { profile, balances, connectedEthAddress, giveawayTokenBalances } = storeToRefs(profileStore);
const { showToast } = useToast();

// Get wallet address from profile store
const walletAddress = computed(() => {
    return profile.value?.giveawayWalletAddress || 'Not connected';
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

// Calculate required balance based on giveaway settings
const requiredBalance = computed(() => {
    if (giveawaySettings.value && giveawaySettings.value.giveawayType) {
        try {
            // Cast to any to avoid type errors with partial giveaway settings
            return getRequiredAmount(giveawaySettings.value as any) || new BigNumber(0);
        } catch (error) {
            console.error('Error calculating required amount:', error);
            return new BigNumber(0);
        }
    }
    return new BigNumber(0);
});

// Check if all requirements are met
const isValid = computed(() => {
    // Valid if the required amount is zero or if we have enough allowance/balance
    if (requiredBalance.value.isZero() &&
        (giveawaySettings.value.giveawayTokenType === 'Allowance' ||
            giveawaySettings.value.giveawayTokenType === 'Balance')) {
        return true;
    }

    // For allowance type, check if we have enough allowance
    if (giveawaySettings.value.giveawayTokenType === 'Allowance') {
        return BigNumber(giveawayTokenBalances.value?.allowances || 0).gte(requiredBalance.value);
    }

    // For balance type, check if we have enough balance
    if (giveawaySettings.value.giveawayTokenType === 'Balance') {
        return BigNumber(giveawayTokenBalances.value?.tokenBalance || 0).gte(requiredBalance.value);
    }

    return false;
});

// Also check gas fee requirement
const gasFeesValid = computed(() => {
    // Estimate required gas fees
    const requiredGasFees = giveawayStore.estimateGalaFees();

    // Check if gas fee requirement is zero or we have enough balance
    return requiredGasFees.isZero() ||
        BigNumber(giveawayTokenBalances.value?.galaBalance || 0).gte(requiredGasFees);
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
</style>