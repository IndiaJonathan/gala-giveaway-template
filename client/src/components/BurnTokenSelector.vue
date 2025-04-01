<template>
    <div class="token-selection">
        <div v-if="!availableTokens">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
        <div v-else-if="availableTokens.length === 0">
            <p>No tokens available</p>
        </div>
        <TokenListItem
            v-else
            v-for="(token, index) in availableTokens.filter((token: TokenBalance) => new BigNumber(token.quantity).gt(0))"
            :key="index"
            :token-image="getImage(token)"
            :token-name="getTokenSymbol(token)"
            :sub-text="``"
            :is-selected="isTokenSelected(token)"
            @click="() => handleTokenClick(token)"
        />
        
        <div v-if="selectedToken" class="quantity-selector">
            <p class="selector-label">Quantity to burn:</p>
            <InputBox 
                v-model="burnQuantity" 
                placeholder="Enter amount to burn"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, ref, watch } from 'vue';
import TokenListItem from './TokenListItem.vue';
import InputBox from './InputBox.vue';
import { tokenToReadable, checkTokenEquivalancy, getTokenSymbol } from '@/utils/GalaHelper';
import type { TokenBalance, TokenClass } from '@gala-chain/connect';
import BigNumber from 'bignumber.js';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';

const props = defineProps({
    availableTokens: {
        type: Array as PropType<TokenBalance[]>,
        required: true
    },
    selectedToken: {
        type: Object as PropType<TokenBalance>,
        default: null
    },
    metadata: {
        type: Map as PropType<Map<string, TokenClass>>,
        required: true
    }
});

const emit = defineEmits(['update:selectedToken', 'token-selected', 'update:quantity']);

// Get the store
const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings } = storeToRefs(giveawayStore);

// Create a computed property that binds to the store
const burnQuantity = computed({
    get: () => giveawaySettings.value.burnTokenQuantity ? new BigNumber(giveawaySettings.value.burnTokenQuantity) : undefined,
    set: (value) => {
        giveawayStore.updateSettings({ burnTokenQuantity: value ? value.toString() : undefined });
    }
});

const getImage = (token: TokenBalance) => {
    const tokenClass = props.metadata.get(tokenToReadable(token));
    return tokenClass ? tokenClass.image : '';
};

const isTokenSelected = (token: TokenBalance): boolean => {
    if (!props.selectedToken) return false;
    return checkTokenEquivalancy(token, props.selectedToken);
};

const handleTokenClick = (token: TokenBalance) => {
    emit('update:selectedToken', token);
    emit('token-selected', token);
    burnQuantity.value = undefined;
};

const isValid = computed(() => {
    if (!props.selectedToken) return false;
    if (!burnQuantity.value) return false;
    
    return burnQuantity.value.gt(0) && 
           burnQuantity.value.lte(new BigNumber(props.selectedToken.quantity));
});

// Emit quantity changes
watch(burnQuantity, (newValue) => {
    if (newValue) {
        emit('update:quantity', newValue);
    }
});

defineExpose({ isValid, burnQuantity });
</script>

<style scoped>
.token-selection {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
    gap: 6px;
    border-radius: 16px;
    border: 1px solid rgba(236, 236, 236, 0.1);
}

.quantity-selector {
    margin-top: 20px;
    width: 100%;
}

.selector-label {
    font-size: 16px;
    color: white;
    margin-bottom: 10px;
}
</style> 