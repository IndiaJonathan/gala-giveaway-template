<template>
    <Collapsible title="Giveaway token balance" :collapsible="false" isOpen class="mb-4">
        <p class="explanatory-text mb-8">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur iaculis pharetra
            lectus quis dictum. Etiam vulputate orci vel orci auctor pellentesque.
        </p>

        <div class="token-info">
            <div class="token-section">
                <div class="token-label">TOKEN</div>
                <div class="token-value">
                    <div class="token-icon">
                        <img v-if="getTokenImage()" class="token-img" :src="getTokenImage()" alt="token icon" />
                        <div v-else class="token-icon-circle"></div>
                        <span>{{ tokenSymbol }}</span>
                    </div>
                </div>
            </div>
            <div v-if="requiredAmount.minus(adminBalanceQuantity).gt(0)" class="missing-allowance">MISSING BALANCE</div>
        </div>

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

        <button class="transfer-token-btn" 
            :disabled="!BigNumber.max(0, requiredAmount.minus(adminBalanceQuantity)).gt(0)" 
            :class="{ 'disabled': !BigNumber.max(0, requiredAmount.minus(adminBalanceQuantity)).gt(0) }" 
            @click="transferToken">
            Transfer Tokens
        </button>
    </Collapsible>
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
import Collapsible from './Collapsible.vue';
import { formatNumber } from '@/utils/Helpers';
import { tokenToReadable } from '@/utils/GalaHelper';

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

.token-img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
}

.token-icon-circle {
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
</style>