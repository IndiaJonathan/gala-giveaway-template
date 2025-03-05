<template>
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

        <div v-if="grantedAllowanceQuantity" class="text-muted mb-4">
            <p>You have a net allowance of <strong>{{ formatNumber(Number(grantedAllowanceQuantity)) }}</strong> tokens
                allocated to the giveaway wallet.
            </p>

            <div v-if="BigNumber(grantedAllowanceQuantity).gte(requiredAmount)" class="success-alert mb-4">
                You have sufficient allowance to start the giveaway.
            </div>
            <div v-else class="text-muted mb-4">
                <p>
                    You need to grant an additional
                    <strong> {{ formatNumber(Number(requiredAmount.minus(grantedAllowanceQuantity))) }}
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
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { GalaChainApi } from '@/services/GalaChainApi'
import BigNumber from "bignumber.js";
import { computed, type PropType } from 'vue'
import { type GiveawaySettingsDto } from '@/utils/types'
import { BrowserConnectClient } from '@gala-chain/connect'
import { isErrorWithMessage } from '@/utils/Helpers';
import { useProfileStore } from '@/stores/profile';
import { storeToRefs } from 'pinia';
import Collapsible from './Collapsible.vue';
import { formatNumber } from '@/utils/Helpers';

const profileStore = useProfileStore();
const { profile } = storeToRefs(profileStore)
const { showToast } = useToast()

const props = defineProps({
    giveawaySettings: {
        type: Object as PropType<GiveawaySettingsDto>,
        required: true
    },
    requiredAmount: {
        type: BigNumber,
        required: true
    },
    grantedAllowanceQuantity: {
        type: BigNumber,
        required: true
    }
})

const emit = defineEmits<{
    (e: 'allowanceGranted'): void
}>()

const tokenSymbol = computed(() => {
    const token = props.giveawaySettings.giveawayToken;
    if (token) {
        // Use collection name if symbol is not available
        return token.collection?.substring(0, 4) || 'Token';
    }
    return 'Select token';
});

async function grantAdditionalAllowance() {
    const browserClient = new BrowserConnectClient();
    await browserClient.connect()

    const tokenService = GalaChainApi.getInstance()

    if (!profile.value || !profile.value.giveawayWalletAddress) {
        showToast(`Unable to get giveaway wallet`, true)
        return
    }

    await tokenService.init()
    if (!props.giveawaySettings.giveawayToken) {
        showToast('Please select a token at step 1!')
    } else {
        try {
            const grant = await tokenService.grantAllowance(
                props.giveawaySettings.giveawayToken,
                props.requiredAmount.minus(new BigNumber(props.grantedAllowanceQuantity)),
                profile.value.giveawayWalletAddress
            )
            if (grant.Status === 1) {
                // Success!
                showToast('Allowance Granted!')
                emit('allowanceGranted')
            }
        } catch (e: unknown) {
            let errorMessage = 'unknown error';
            if (isErrorWithMessage(e)) {
                errorMessage = e.Message
            }
            console.error(errorMessage)
            showToast(`Unable to grant allowance. Error: ${errorMessage}`, true);
        }
    }
}
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

.grant-allowance-btn {
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

.grant-allowance-btn:hover:not(.disabled) {
    background-color: #333;
}

.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>