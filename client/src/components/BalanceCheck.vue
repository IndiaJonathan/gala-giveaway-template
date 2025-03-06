<template>
    <TokenActionPanel
        title="Giveaway token balance"
        :tokenImage="getTokenImage()"
        :tokenSymbol="tokenSymbol"
        :showStatusIndicator="requiredAmount.minus(adminBalanceQuantity).gt(0)"
        statusText="MISSING BALANCE"
        actionButtonText="Transfer Tokens"
        :actionDisabled="!BigNumber.max(0, requiredAmount.minus(adminBalanceQuantity)).gt(0)"
        @action-click="transferToken"
    >
        <template #content>
            <div class="balance-info">
                <div class="balance-item">
                    <div class="balance-label">REQUIRED BALANCE</div>
                    <div class="balance-value">{{ formatNumber(Number(requiredAmount)) }}</div>
                </div>
                <div class="balance-item">
                    <div class="balance-label">YOUR BALANCE</div>
                    <div class="balance-value">{{ formatNumber(Number(adminBalanceQuantity)) }}</div>
                </div>
                <div class="balance-item">
                    <div class="balance-label">MISSING BALANCE</div>
                    <div class="balance-value">{{ formatNumber(Number(BigNumber.max(0, requiredAmount.minus(adminBalanceQuantity)))) }}</div>
                </div>
            </div>
        </template>
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

const props = defineProps({
    giveawaySettings: {
        type: Object as PropType<GiveawaySettingsDto>,
        required: true
    },
    adminBalanceQuantity: {
        type: BigNumber,
        required: true
    },
    requiredAmount: {
        type: BigNumber,
        required: true
    }
})

const emit = defineEmits<{
    (e: 'token-transferred'): void
}>()

const profileStore = useProfileStore();
const { profile, metadata } = storeToRefs(profileStore)
const { showToast } = useToast()

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

const balanceRequirementsMet = computed(() => {
    return new BigNumber(props.adminBalanceQuantity).gte(props.requiredAmount);
});

watch(balanceRequirementsMet, (newValue) => {
    if (newValue) {
        emit('token-transferred');
    }
});

onMounted(() => {
    if (balanceRequirementsMet.value) {
        emit('token-transferred');
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

async function transferToken() {
    await profileStore.connect()

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
            const grant = await tokenService.transferToken(
                props.giveawaySettings.giveawayToken,
                props.requiredAmount.minus(new BigNumber(props.adminBalanceQuantity)).toString(),
                profile.value.giveawayWalletAddress
            )
            if (grant.Status === 1) {
                // Success!
                showToast('Token transferred!')
                emit('token-transferred')
            }
        } catch (e: unknown) {
            let errorMessage = 'unknown error';
            if (isErrorWithMessage(e)) {
                errorMessage = e.Message
            }
            console.error(errorMessage)
            showToast(`Unable to transfer token. Error: ${errorMessage}`, true);
        }
    }
}
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
</style>