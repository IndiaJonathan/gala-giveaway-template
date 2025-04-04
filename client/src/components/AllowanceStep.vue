<template>
    <div class="allowance-step-container">
        <Collapsible title="Giveaway escrow wallet" :collapsible="false" isOpen class="mb-4">
            <p class="explanatory-text mb-8">
                This wallet will securely hold your giveaway tokens until they are claimed by winners. The tokens will
                be automatically distributed to winners based on your giveaway settings.
                You cannot withdraw the tokens from this wallet once sent!
            </p>
            <div class="wallet-address">
                <div class="label">WALLET ADDRESS:</div>
                <div class="address-container">
                    <div class="address">{{ walletAddress }}</div>
                    <button class="copy-button" @click="copyAddressToClipboard" title="Copy to clipboard">
                        <v-icon icon="mdi-content-copy" size="small"></v-icon>
                    </button>
                </div>
            </div>

        </Collapsible>

        <div v-if="!balances" class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading balance information...</div>
        </div>
        <TokenRequirementCheck v-else ref="tokenRequirementCheck"
            :includeGasFees="isGalaToken && giveawaySettings.giveawayTokenType === GiveawayTokenType.BALANCE"
            @is-valid="onTokenRequirementValid" />

        <!-- Only show separate GasFeeBalance if token is not GALA or if using allowance -->
        <GasFeeBalance v-if="!isGalaToken || giveawaySettings.giveawayTokenType === 'Allowance'"
            :giveawaySettings="giveawaySettings as GiveawaySettingsDto" 
            @token-transferred="checkRequirements"
            @is-valid="onGasFeeValid" 
            ref="gasFeeBalance" />
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onMounted } from 'vue';
import Collapsible from './Collapsible.vue';
import { findTokenInArray } from '@/utils/Helpers';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';
import { useProfileStore } from '@/stores/profile';
import BigNumber from 'bignumber.js';
import { useToast } from '@/composables/useToast';
import { type GiveawaySettingsDto } from '@/utils/types';
import { GALA } from '@/utils/constants';
import TokenRequirementCheck from './TokenRequirementCheck.vue';
import GasFeeBalance from './GasFeeBalance.vue';
import { GiveawayTokenType } from '@/utils/types';

const emit = defineEmits(['is-valid']);

const tokenRequirementCheck = ref<InstanceType<typeof TokenRequirementCheck> | null>(null);
const gasFeeBalance = ref<InstanceType<typeof GasFeeBalance> | null>(null);

// Track validity state from child components
const tokenRequirementValid = ref(false);
const gasFeeValid = ref(true); // Default to true if GasFeeBalance is not shown

const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings, requiredGas } = storeToRefs(giveawayStore);
const profileStore = useProfileStore();
const { profile, balances } = storeToRefs(profileStore);
const { showToast } = useToast();

// Get wallet address from profile store
const walletAddress = computed(() => {
    return profile.value?.giveawayWalletAddress || 'Not connected';
});

// Function to copy address to clipboard
const copyAddressToClipboard = () => {
    if (walletAddress.value && walletAddress.value !== 'Not connected') {
        navigator.clipboard.writeText(walletAddress.value)
            .then(() => {
                showToast('Wallet address copied to clipboard!');
            })
            .catch((err) => {
                console.error('Failed to copy: ', err);
                showToast('Failed to copy address', true);
            });
    }
};

// Check if current token is GALA
const isGalaToken = computed(() => {
    if (!giveawaySettings.value.giveawayToken) return false;

    const token = giveawaySettings.value.giveawayToken;
    return token.collection === GALA.collection &&
        token.category === GALA.category &&
        token.type === GALA.type &&
        token.additionalKey === GALA.additionalKey;
});

// Event handlers for child component validity changes
const onTokenRequirementValid = (valid: boolean) => {
    tokenRequirementValid.value = valid;
    checkRequirements();
};

const onGasFeeValid = (valid: boolean) => {
    gasFeeValid.value = valid;
    checkRequirements();
};

// Combined validation based on both child components
const allRequirementsMet = computed(() => {
    // If using GALA with Balance type, gas fee is included in token requirement
    if (isGalaToken.value && giveawaySettings.value.giveawayTokenType === GiveawayTokenType.BALANCE) {
        return tokenRequirementValid.value;
    }
    
    // Otherwise, both requirements must be met
    return tokenRequirementValid.value && gasFeeValid.value;
});

// Function to check requirements and emit validity
const checkRequirements = () => {
    emit('is-valid', allRequirementsMet.value);
};

// Watch for changes in validity and emit
watch([allRequirementsMet], (newValue) => {
    emit('is-valid', newValue[0]);
});

// Initial check when component is mounted
onMounted(() => {
    // When mounted, if TokenRequirementCheck is mounted, get its isValid state directly
    if (tokenRequirementCheck.value) {
        tokenRequirementValid.value = tokenRequirementCheck.value.isValid;
    }
    
    // If GasFeeBalance is mounted, get its isValid state directly
    if (gasFeeBalance.value) {
        gasFeeValid.value = gasFeeBalance.value.isValid;
    } else if (isGalaToken.value && giveawaySettings.value.giveawayTokenType === GiveawayTokenType.BALANCE) {
        // If gas fee is included in token requirement, mark as valid
        gasFeeValid.value = true;
    }
    
    checkRequirements();
});

defineExpose({ isValid: allRequirementsMet });
</script>

<style scoped>
/* Add container style */
.allowance-step-container {
    width: 100%;
    padding: 0 8px;
    box-sizing: border-box;
    overflow-x: hidden;
}

.explanatory-text {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    text-align: left;
    color: rgba(255, 255, 255, 0.6);
    word-wrap: break-word;
}

.mb-8 {
    margin-bottom: 32px;
}

.mb-4 {
    margin-bottom: 16px;
}

.wallet-address {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
}

.label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
}

.address-container {
    display: flex;
    align-items: center;
    width: 100%;
    word-break: break-all;
}

.address {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 1);
    margin-right: 8px;
    overflow-wrap: break-word;
    word-wrap: break-word;
    max-width: calc(100% - 40px);
}

.copy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: none;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.6);
    transition: color 0.3s;
    padding: 4px;
    border-radius: 4px;
}

.copy-button:hover {
    color: rgba(255, 255, 255, 1);
    background-color: rgba(255, 255, 255, 0.1);
}

.token-info {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
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
    flex-wrap: wrap;
    gap: 16px;
}

.balance-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
    min-width: 200px;
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
    word-break: break-word;
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
    word-wrap: break-word;
    white-space: normal;
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
    padding: 0 16px;
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

/* Media queries for responsive design */
@media (max-width: 600px) {
    .allowance-step-container {
        padding: 0 12px;
    }
    
    .balance-info {
        flex-direction: column;
    }
    
    .balance-item {
        width: 100%;
        margin-bottom: 16px;
    }
    
    .address {
        font-size: 12px;
    }
    
    .label {
        font-size: 12px;
    }
    
    .explanatory-text {
        font-size: 14px;
    }

    :deep(.collapsible-container) {
        border-radius: 8px;
        padding: 16px 12px;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
    }
    
    /* Fix any potential button overflow */
    .grant-allowance-btn,
    .transfer-token-btn {
        padding: 12px 16px;
        font-size: 13px;
    }
    
    .token-info {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .token-label {
        margin-bottom: 4px;
        margin-right: 0;
    }
}
</style>