<template>
    <TokenActionPanel
        title="Giveaway token allowance"
        :tokenImage="getTokenImage()"
        :tokenSymbol="tokenSymbol"
        tokenLabelText="TOKEN:"
        actionButtonText="Grant Allowance"
        :actionDisabled="false"
        @action-click="grantAdditionalAllowance"
    >
        <template #content>
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
        </template>

        <!-- Override default action button since we have custom buttons in the content -->
        <template #actionButton></template>
    </TokenActionPanel>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { GalaChainApi } from '@/services/GalaChainApi'
import BigNumber from "bignumber.js";
import { computed, type PropType, watch, onMounted } from 'vue'
import { type GiveawaySettingsDto } from '@/utils/types'
import { BrowserConnectClient } from '@gala-chain/connect'
import { isErrorWithMessage } from '@/utils/Helpers';
import { useProfileStore } from '@/stores/profile';
import { storeToRefs } from 'pinia';
import { formatNumber } from '@/utils/Helpers';
import { tokenToReadable } from '@/utils/GalaHelper';
import TokenActionPanel from './TokenActionPanel.vue';

const profileStore = useProfileStore();
const { profile, metadata } = storeToRefs(profileStore)
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
    (e: 'allowance-granted'): void
}>()

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
    if (!props.giveawaySettings.giveawayToken) return '';
    
    const tokenClass = metadataMap.value.get(tokenToReadable(props.giveawaySettings.giveawayToken));
    if (tokenClass && tokenClass.image) {
        return tokenClass.image;
    } else {
        return '';
    }
};

// Add computed property to check if allowance requirements are met
const allowanceRequirementsMet = computed(() => {
    return new BigNumber(props.grantedAllowanceQuantity).gte(props.requiredAmount);
});

// Add watcher to emit when allowance requirements are met
watch(allowanceRequirementsMet, (newValue) => {
    if (newValue) {
        emit('allowance-granted');
    }
});

// Emit immediately if requirements are already met
onMounted(() => {
    if (allowanceRequirementsMet.value) {
        emit('allowance-granted');
    }
});

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
                emit('allowance-granted')
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