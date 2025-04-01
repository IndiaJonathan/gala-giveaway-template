<template>
    <div class="token-selection">

        <h5 v-if="!justSelector" style="margin-bottom: 32px;" for="token">Select Giveaway Token<span
                class="required">*</span></h5>
        <ToggleSwitch v-if="!justSelector" v-model:selected="selectedVal" style="margin-bottom: 32px; width: 100%;"
            :options="options">
        </ToggleSwitch>

        <!-- Balances -->
        <div v-if="selectedVal === options[0].key" style="width: 100%;">
            <div v-if="!balances">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <div v-else-if="balances.availableBalances.length === 0">
                <p>No current balances</p>
            </div>
            <div class="scrollable-list" v-else>
                <TokenListItem
                    v-for="(token, index) in balances.availableBalances.filter(token => new BigNumber(token.quantity).gt(0))"
                    :key="index"
                    :token-image="getImage(token)"
                    :token-name="getTokenSymbol(token)"
                    :sub-text="`Balance: ${token.quantity}`"
                    :is-selected="isTokenBalanceSelected(token)"
                    @click="() => handleTokenClick(token)"
                />
            </div>
        </div>

        <!-- Created Tokens -->
        <div v-if="selectedVal === options[1].key" style="width: 100%;">
            <div v-if="!createdTokens">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <div v-else-if="createdTokens.length === 0">
                <v-alert type="info" color="primary" dark>
                    You haven't created any tokens on this wallet. Create one at:
                    <a :href="galaConnectURL" target="_blank" style="color: #ffffff; text-decoration: underline;">Gala
                        Connect</a>
                </v-alert>
            </div>
            <div class="scrollable-list" v-else>
                <TokenListItem
                    v-for="(transaction, index) in createdTokens"
                    :key="index"
                    :token-image="transaction.tokenDetails.image"
                    :token-name="transaction.tokenDetails.name || transaction.tokenDetails.tokenClass.collection"
                    :sub-text="`Symbol: ${transaction.tokenDetails.symbol}`"
                    :is-selected="isTransactionSelected(transaction)"
                    @click="() => handleCreatedTokenClick(transaction)"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, type PropType, type Ref, ref, watch } from 'vue';
import ToggleSwitch from './ToggleSwitch.vue';
import TokenListItem from './TokenListItem.vue';
import { tokenToReadable, checkTokenEquivalancy, getTokenSymbol } from '@/utils/GalaHelper';
import type { TokenAllowance, TokenBalance, TokenClass } from '@gala-chain/connect';
import type { TokenClassKeyProperties } from '@gala-chain/api';
import type { Transaction } from '@/services/GalaSwapApi';
import { storeToRefs } from 'pinia';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { useProfileStore } from '@/stores/profile';
import { GiveawayTokenType } from '@/utils/types';
import BigNumber from 'bignumber.js';
const galaConnectURL = import.meta.env.VITE_GALA_CONNECT_URL

const giveawayStore = useCreateGiveawayStore();
const profileStore = useProfileStore();

const { giveawaySettings } = storeToRefs(giveawayStore)
const { profile, isConnected, error, balances, metadata, createdTokens, connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)


const props = defineProps({
    justSelector: {
        type: Boolean,
        default: false
    }
})


const options: [
    { key: string; label: string },
    { key: string; label: string }
] = [{ key: GiveawayTokenType.BALANCE, label: "From Balances" }, { key: GiveawayTokenType.ALLOWANCE, label: "From allowances" }]


const selectedVal = computed({
    get: () => giveawayStore.giveawaySettings.giveawayTokenType,
    set: (value: string) => {
        giveawayStore.updateSettings({ giveawayTokenType: value as GiveawayTokenType });
    }
});


const metadataMap = computed(() => {
    const map = new Map<string, TokenClass>();

    if (metadata) {
        metadata.value.forEach(metadata => {
            const key = tokenToReadable(metadata);
            map.set(key, metadata);
        });
    }
    return map;
});


const isValid = computed(() => {
    return !!giveawaySettings.value.giveawayToken;
});

watch(isValid, (newValue) => {
    emit('is-valid', newValue);
});

const getImage = (token: TokenClassKeyProperties) => {
    const tokenClass = metadataMap.value.get(tokenToReadable(token))
    if (tokenClass) {
        return tokenClass.image;
    } else {
        return ''
    }
}

// Helper function to determine if a balance token is selected
const isTokenBalanceSelected = (token: TokenBalance): boolean => {
    if (!giveawaySettings.value.giveawayToken) return false;
    
    // Check if the giveaway token is a TokenBalance type
    if ('collection' in giveawaySettings.value.giveawayToken && 
        'category' in giveawaySettings.value.giveawayToken &&
        'type' in giveawaySettings.value.giveawayToken) {
        
        return checkTokenEquivalancy(token, giveawaySettings.value.giveawayToken);
    }
    
    return false;
};

const isTransactionSelected = (transaction: Transaction): boolean => {
    if (!giveawaySettings.value.giveawayToken) return false;
    
    const tokenBalanceObject = transactionToTokenBalance(transaction);
    return isTokenBalanceSelected(tokenBalanceObject);
}
    

// Convert a Transaction to a TokenBalance compatible object
const transactionToTokenBalance = (transaction: Transaction): TokenBalance => {
    // Create a TokenBalance compatible object from the transaction
    // Using 'any' type to bypass strict type checking since we know what fields are needed
    return {
        owner: connectedUserGCAddress.value as any,
        collection: transaction.tokenDetails.tokenClass.collection,
        category: transaction.tokenDetails.tokenClass.category,
        type: transaction.tokenDetails.tokenClass.type,
        additionalKey: transaction.tokenDetails.tokenClass.additionalKey,
        quantity: BigNumber(transaction.tokenDetails.maxSupply),
    };
};

const emit = defineEmits(['update:selectedToken', 'update:selected', 'token-clicked', 'is-valid']);

const handleTokenClick = (token: TokenBalance) => {
    giveawayStore.updateSettings({ giveawayToken: token });
    console.log('token', token)
    emit('token-clicked', token);
};

const handleCreatedTokenClick = (transaction: Transaction) => {
    // Convert Transaction to TokenBalance compatible object
    const tokenBalanceObject = transactionToTokenBalance(transaction);
    console.log('tokenBalanceObject', tokenBalanceObject)
    giveawayStore.updateSettings({ giveawayToken: tokenBalanceObject });
    emit('token-clicked', tokenBalanceObject);
};

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

/* Reusable scrollable list styling */
.scrollable-list {
    max-height: 300px;
    overflow-y: auto;
    width: 100%;
    
    /* Custom scrollbar styling */
    &::-webkit-scrollbar {
        width: 6px;
        background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        
        &:hover {
            background-color: rgba(255, 255, 255, 0.3);
        }
    }

    &::-webkit-scrollbar-track {
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    /* Firefox scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.1);
}

.label {
    font-size: 16px;
    color: white;
}

.required {
    color: red;
}
</style>