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

        <Collapsible title="Giveaway token allowance" :collapsible="false" isOpen class="mb-4">
            <p class="explanatory-text mb-8">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur iaculis pharetra
                lectus quis dictum. Etiam vulputate orci vel orci auctor pellentesque.
            </p>

            <div class="token-info">
                <div class="token-label">TOKEN:</div>
                <div class="token-value">
                    <div class="token-icon">
                        <span>{{ tokenSymbol }}</span>
                    </div>
                </div>
            </div>

            <div v-if="giveawayAllowances" class="text-muted mb-4">
                <p>You have a net allowance of <strong>{{ formatNumber(Number(giveawayAllowances.allowances))
                        }}</strong> tokens
                    allocated to the giveaway wallet.
                </p>

                <div v-if="BigNumber(giveawayAllowances.allowances).gte(requiredBalance)" class="success-alert mb-4">
                    You have sufficient allowance to start the giveaway.
                </div>
                <div v-else class="text-muted mb-4">
                    <p>
                        You need to grant an additional
                        <strong> {{ formatNumber(Number(requiredBalance.minus(giveawayAllowances.allowances))) }}
                        </strong>
                        tokens to meet the requirement.
                    </p>
                    <button class="grant-allowance-btn" @click="grantAdditionalAllowance">
                        Grant Additional Allowance
                    </button>
                </div>
            </div>
            <div v-else class="text-muted mb-4">
                <p>You have not granted any allowance of this token to the giveaway wallet yet.</p>
                <button class="grant-allowance-btn" @click="grantAdditionalAllowance">
                    Grant Allowance
                </button>
            </div>
        </Collapsible>

        <Collapsible title="Gas fee balance" :collapsible="false" isOpen>
            <p class="explanatory-text mb-8">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur iaculis pharetra
                lectus quis dictum. Etiam vulputate orci vel orci auctor pellentesque.
            </p>

            <div class="token-info">
                <div class="token-label">TOKEN:</div>
                <div class="token-value">
                    <div class="token-icon">
                        <span>$GALA</span>
                    </div>
                </div>
            </div>

            <div v-if="hasMissingGasBalance" class="missing-allowance">MISSING BALANCE</div>

            <div class="balance-info">
                <div class="balance-item">
                    <div class="balance-label">REQUIRED BALANCE</div>
                    <div class="balance-value">{{ formatNumber(Number(estimateGalaFees())) }}</div>
                </div>
                <div class="balance-item">
                    <div class="balance-label">YOUR BALANCE</div>
                    <div class="balance-value">{{ formatNumber(Number(yourGasBalance)) }}</div>
                </div>
                <div class="balance-item">
                    <div class="balance-label">MISSING BALANCE</div>
                    <div class="balance-value">{{ formatNumber(Number(missingGasBalance)) }}</div>
                </div>
            </div>

            <button class="transfer-token-btn" :class="{ 'disabled': !hasMissingGasBalance }" @click="transferToken">
                Transfer Token
            </button>
        </Collapsible>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onMounted } from 'vue';
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

const emit = defineEmits(['is-valid']);

const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings } = storeToRefs(giveawayStore);
const profileStore = useProfileStore();
const { profile, balances, connectedEthAddress, giveawayAllowances } = storeToRefs(profileStore);
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

// Gas token is always GALA
const gasTokenSymbol = ref('$GALA');

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

// Gas fee data
const yourGasBalance = ref(new BigNumber(505));
const missingGasBalance = computed(() => {
    return BigNumber.max(0, estimateGalaFees().minus(yourGasBalance.value));
});
const hasMissingGasBalance = computed(() => missingGasBalance.value.gt(0));

// Check if all requirements are met
const isValid = computed(() => {
    return BigNumber(giveawayAllowances.value?.allowances || 0).gte(requiredBalance.value) && !hasMissingGasBalance.value;
});

function getGalaCost(balanceData: GiveawayDetails) {
    let additional: BigNumber = BigNumber(0);
    if (giveawaySettings.value.giveawayTokenType === 'Balance') {
        additional = requiredBalance.value;
    }
    return additional.plus(BigNumber(balanceData.currentGalaFeesNeeded).plus(estimateGalaFees()))
}

function estimateGalaFees() {
    if (giveawaySettings.value.giveawayType === 'DistributedGiveaway') {
        return BigNumber(giveawaySettings.value.maxWinners || 1).dividedBy(1000).integerValue(BigNumber.ROUND_CEIL);
    } else if (giveawaySettings.value.giveawayType === 'FirstComeFirstServe') {
        return BigNumber(giveawaySettings.value.maxWinners || 1)
    } else {
        throw new Error(`Unknown giveaway type`)
    }
}

// Functions to handle actions
const grantAdditionalAllowance = async () => {
    const browserClient = new BrowserConnectClient();
    await browserClient.connect();

    const tokenService = GalaChainApi.getInstance();

    if (!profile.value || !profile.value.giveawayWalletAddress) {
        showToast(`Unable to get giveaway wallet`, true);
        return;
    }

    await tokenService.init();
    if (!giveawaySettings.value.giveawayToken) {
        showToast('Please select a token at step 1!');
    } else {
        try {
            const additionalAllowance = requiredBalance.value.minus(giveawayAllowances.value?.allowances || 0);
            const grant = await tokenService.grantAllowance(
                giveawaySettings.value.giveawayToken as TokenClassKeyProperties,
                additionalAllowance,
                profile.value.giveawayWalletAddress
            );

            if (grant.Status === 1) {
                // Success!
                showToast('Allowance Granted!');

                try {
                    // Fetch the updated allowance data using the profile store
                    await profileStore.getGiveawayAllowances(
                        giveawaySettings.value.giveawayToken as TokenClassKeyProperties
                    );

                    checkValidity();
                } catch (fetchError) {
                    console.error('Error fetching updated allowance:', fetchError);
                    // If we can't get the updated value, use the required balance as an estimate
                    // This is handled by the store now
                }
            }
        } catch (e: unknown) {
            let errorMessage = 'unknown error';
            if (isErrorWithMessage(e)) {
                errorMessage = e.Message;
            }
            console.error(errorMessage);
            showToast(`Unable to grant allowance. Error: ${errorMessage}`, true);
        }
    }
};

const transferToken = async () => {
    // Implement the logic to transfer tokens
    const browserClient = new BrowserConnectClient();
    await browserClient.connect();

    const tokenService = GalaChainApi.getInstance();

    if (!profile.value || !profile.value.giveawayWalletAddress) {
        showToast(`Unable to get giveaway wallet`, true);
        return;
    }

    await tokenService.init();
    try {
        // Use the GALA token constant for gas token transfers

        const grant = await tokenService.transferToken(
            GALA,
            missingGasBalance.value.toString(),
            profile.value.giveawayWalletAddress
        );

        if (grant.Status === 1) {
            // Success!
            showToast('Gas tokens transferred successfully!');

            // Update the balance after successful transfer
            yourGasBalance.value = estimateGalaFees();
            checkValidity();
        }
    } catch (e: unknown) {
        let errorMessage = 'unknown error';
        if (isErrorWithMessage(e)) {
            errorMessage = e.Message;
        }
        console.error(errorMessage);
        showToast(`Unable to transfer gas tokens. Error: ${errorMessage}`, true);
    }
};

const checkValidity = () => {
    emit('is-valid', isValid.value);
};

// Watch for changes in validity
watch(isValid, (newValue) => {
    emit('is-valid', newValue);
});

// Fetch allowance data when component is mounted
onMounted(async () => {
    if (giveawaySettings.value.giveawayToken && profile.value?.galaChainAddress) {
        try {
            // Use the profile store to fetch allowances
            await profileStore.getGiveawayAllowances(
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

defineExpose({ isValid });
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