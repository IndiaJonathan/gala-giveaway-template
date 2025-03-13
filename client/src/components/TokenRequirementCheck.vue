<template>
    {{ totalRequiredAmount }}
    <TokenActionPanel v-if="checkType" :title="checkType === GiveawayTokenType.ALLOWANCE ? 'Giveaway token allowance' : 'Giveaway token balance'"
        :tokenImage="getTokenImage()" :tokenSymbol="tokenSymbol" :showStatusIndicator="isBalanceDeficient"
        statusText="MISSING BALANCE"
        :actionButtonText="checkType === GiveawayTokenType.ALLOWANCE ? 'Grant Allowance' : 'Transfer Tokens'"
        :actionDisabled="checkType === GiveawayTokenType.BALANCE ? !hasMissingBalance : false" @action-click="performAction">
        <template #content>
            <!-- Allowance UI -->
            <div v-if="checkType === GiveawayTokenType.ALLOWANCE">
                <div v-if="currentAmount" class="text-muted mb-4">
                    <p>You have a net allowance of <strong>{{ formatNumber(Number(currentAmount)) }}</strong> tokens
                        allocated to the giveaway wallet.
                    </p>

                    <div v-if="isRequirementMet" class="success-alert mb-4">
                        You have sufficient allowance to start the giveaway.
                    </div>
                    <div v-else class="text-muted mb-4">
                        <p>
                            You need to grant an additional
                            <strong>{{ formatNumber(Number(getMissingAmount())) }}</strong>
                            tokens to meet the requirement.
                        </p>
                    </div>
                </div>
                <div v-else class="text-muted mb-4">
                    <p>You have not granted any allowance of this token to the giveaway wallet yet.</p>
                </div>
            </div>

            <!-- Balance UI -->
            <div v-else>
                <div class="balance-info">
                    <div class="balance-item">
                        <div class="balance-label">REQUIRED BALANCE</div>
                        <div class="balance-value">{{ formatNumber(Number(totalRequiredAmount)) }}</div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-label">YOUR BALANCE</div>
                        <div class="balance-value">{{ formatNumber(Number(currentAmount)) }}</div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-label">MISSING BALANCE</div>
                        <div class="balance-value">{{ formatNumber(Number(getMissingAmount())) }}</div>
                    </div>
                </div>

                <!-- For GALA token, show gas fee breakdown -->
                <div v-if="isGalaToken && checkType === GiveawayTokenType.BALANCE" class="gas-fee-breakdown">
                    <div class="divider"></div>
                    <h3 class="breakdown-title">Balance Breakdown:</h3>
                    <div class="breakdown-grid">
                        <div class="breakdown-item">
                            <div class="breakdown-label">Token Requirement:</div>
                            <div class="breakdown-value">{{ formatNumber(Number(requiredAmount)) }}</div>
                        </div>
                        <div class="breakdown-item">
                            <div class="breakdown-label">Gas Fee Requirement:</div>
                            <div class="breakdown-value">{{ formatNumber(Number(actualGasFeeNeeded)) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </TokenActionPanel>
    <div v-else>
        <p>No check type found</p>
    </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { GalaChainApi } from '@/services/GalaChainApi'
import BigNumber from "bignumber.js";
import { computed, type PropType, watch, onMounted } from 'vue'
import { isErrorWithMessage } from '@/utils/Helpers';
import { useProfileStore } from '@/stores/profile';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';
import { formatNumber } from '@/utils/Helpers';
import { tokenToReadable } from '@/utils/GalaHelper';
import TokenActionPanel from './TokenActionPanel.vue';
import { GALA } from '@/utils/constants';
import galaTokenImage from '@/assets/gala-token.png';
import { GiveawayTokenType } from '@/utils/types';

const props = defineProps({
    // Whether to include gas fees in the calculation (only for GALA tokens)
    includeGasFees: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits<{
    (e: 'requirement-met'): void,
    (e: 'balance-updated'): void
}>()

const profileStore = useProfileStore();
const giveawayStore = useCreateGiveawayStore();
const { profile, metadata, giveawayTokenBalances } = storeToRefs(profileStore)
const { giveawaySettings, galaFeeEstimate, requiredTokenAmount } = storeToRefs(giveawayStore);
const { showToast } = useToast()

const checkType = computed(() => {
    return giveawaySettings.value.giveawayTokenType
})

const gasFeeAmount = computed(() => {
    return galaFeeEstimate.value;
});

// Use the store's requiredTokenAmount
const requiredAmount = computed(() => {
    return requiredTokenAmount.value;
});

// Get current amount from store instead of props
const currentAmount = computed(() => {
    if (!giveawayTokenBalances.value) return new BigNumber(0);

    if (checkType.value === GiveawayTokenType.ALLOWANCE) {
        return new BigNumber(giveawayTokenBalances.value.allowances || '0');
    } else {
        return new BigNumber(giveawayTokenBalances.value.tokenBalance || '0');
    }
});

// Get galaNeededForOtherGiveaways from store instead of props
const galaNeededForOtherGiveaways = computed(() => {
    if (!giveawayTokenBalances.value) return new BigNumber(0);
    return new BigNumber(giveawayTokenBalances.value.galaNeededForOtherGiveaways || '0');
});

// Check if the token is GALA
const isGalaToken = computed(() => {
    if (!giveawaySettings.value.giveawayToken) return false;

    const token = giveawaySettings.value.giveawayToken;
    return token.collection === GALA.collection &&
        token.category === GALA.category &&
        token.type === GALA.type &&
        token.additionalKey === GALA.additionalKey;
});

// Calculate the actual gas fee amount needed (total - already accounted for)
const actualGasFeeNeeded = computed(() => {
    if (gasFeeAmount.value) {
        return BigNumber.max(0, gasFeeAmount.value.minus(galaNeededForOtherGiveaways.value));
    }
    return gasFeeAmount.value || new BigNumber(0);
});

// Total required amount including gas fees if token is GALA
const totalRequiredAmount = computed(() => {
    if (isGalaToken.value && props.includeGasFees && checkType.value === GiveawayTokenType.BALANCE) {
        return requiredAmount.value?.plus(actualGasFeeNeeded.value) || new BigNumber(0);
    }
    return requiredAmount.value || new BigNumber(0);
});

const metadataMap = computed(() => {
    const map = new Map();

    if (metadata.value) {
        metadata.value.forEach(metadata => {
            const key = tokenToReadable(metadata);
            map.set(key, metadata);
        });
    }

    return map;
});

const getTokenImage = () => {
    if (isGalaToken.value) return galaTokenImage;

    if (!giveawaySettings.value.giveawayToken) return '';

    const tokenClass = metadataMap.value.get(tokenToReadable(giveawaySettings.value.giveawayToken));
    if (tokenClass && tokenClass.image) {
        return tokenClass.image;
    } else {
        return '';
    }
};

const isRequirementMet = computed(() => {
    return currentAmount.value.gte(totalRequiredAmount.value);
});

const isBalanceDeficient = computed(() => {
    return !isRequirementMet.value;
});

const hasMissingBalance = computed(() => {
    return getMissingAmount().gt(0);
});

const getMissingAmount = () => {
    return BigNumber.max(0, totalRequiredAmount.value.minus(currentAmount.value));
};

watch(isRequirementMet, (newValue) => {
    if (newValue) {
        emit('requirement-met');
    }
});

onMounted(() => {
    if (isRequirementMet.value) {
        emit('requirement-met');
    }
});

const tokenSymbol = computed(() => {
    if (isGalaToken.value) return 'GALA';

    const token = giveawaySettings.value.giveawayToken;
    if (token) {
        // Use collection name if symbol is not available
        return token.collection?.substring(0, 4) || 'Token';
    }
    return 'Select token';
});

async function performAction() {
    await profileStore.connect();

    const tokenService = GalaChainApi.getInstance();

    if (!profile.value || !profile.value.giveawayWalletAddress) {
        showToast(`Unable to get giveaway wallet`, true);
        return;
    }

    await tokenService.init();
    if (!giveawaySettings.value.giveawayToken) {
        showToast('Please select a token at step 1!');
        return;
    }

    // Handle different actions based on checkType
    try {
        let result;

        if (checkType.value === GiveawayTokenType.ALLOWANCE) {
            result = await tokenService.grantAllowance(
                giveawaySettings.value.giveawayToken,
                getMissingAmount(),
                profile.value.giveawayWalletAddress
            );

            if (result.Status === 1) {
                showToast('Allowance Granted!');
                emit('requirement-met');
            }
        } else {
            result = await tokenService.transferToken(
                giveawaySettings.value.giveawayToken,
                getMissingAmount().toString(),
                profile.value.giveawayWalletAddress
            );

            if (result.Status === 1) {
                showToast('Token transferred!');
                emit('requirement-met');

                // Add this line to force a refresh of the component data
                await profileStore.refreshGiveawayTokenBalances(giveawaySettings.value.giveawayToken);

                // Optional: emit an event to inform parent component to update the currentAmount prop
                emit('balance-updated');
            }
        }
    } catch (e: unknown) {
        let errorMessage = 'unknown error';
        if (isErrorWithMessage(e)) {
            errorMessage = e.Message;
        }
        console.error(errorMessage);
        showToast(`Unable to ${checkType.value === GiveawayTokenType.ALLOWANCE ? 'grant allowance' : 'transfer token'}. Error: ${errorMessage}`, true);
    } finally {
        console.log('refreshing giveaway token balances');
        await profileStore.refreshGiveawayTokenBalances(giveawaySettings.value.giveawayToken);
    }
}
</script>

<style scoped>
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

.mb-4 {
    margin-bottom: 16px;
}

.gas-fee-breakdown {
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