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
            :sub-text="`Balance: ${token.quantity}`"
            :is-selected="isTokenSelected(token)"
            @click="() => handleTokenClick(token)"
        />
    </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from 'vue';
import TokenListItem from './TokenListItem.vue';
import { tokenToReadable, checkTokenEquivalancy, getTokenSymbol } from '@/utils/GalaHelper';
import type { TokenBalance, TokenClass } from '@gala-chain/connect';
import BigNumber from 'bignumber.js';

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

const emit = defineEmits(['update:selectedToken', 'token-selected']);

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
};

const isValid = computed(() => {
    return !!props.selectedToken;
});

defineExpose({ isValid });
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
</style> 