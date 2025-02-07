<template>
    <div class="token-selection">

        <h5 style="margin-bottom: 32px;" for="token">Select Giveaway Token <span class="required">*</span></h5>
        <ToggleSwitch style="margin-bottom: 32px;" :options="options"></ToggleSwitch>

        <div v-if="!balances">
            <v-progress-circular indeterminate></v-progress-circular>
        </div>
        <div v-else-if="balances.length === 0">
            <p>No current balances</p>
        </div>
        <div v-else v-for="(token, index) in balances" :key="index" class="token-item">
            <!-- {{ JSON.stringify(token) }} -->
            <img v-if="token.token.image" class="token-icon" :src="token.token.image" alt="token icon" />
            <div v-else class="token-icon-circle"></div>

            <div class="token-details">
                <div class="token-name paragraph-medium-regular">{{ token.token.collection }}</div>
                <div class="token-balance paragraph-medium-bold">Balance: {{ token.balance.getQuantityTotal() }}</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { type PropType, ref } from 'vue';
import ToggleSwitch from './ToggleSwitch.vue';
import { TokenBalance, TokenBalanceWithMetadata } from '@gala-chain/api';


const props = defineProps({
    balances: { type: Object as PropType<TokenBalanceWithMetadata[]>, required: false },
    clickable: {
        type: Boolean, default: false, required: false
    },
});

// Define a Token interface to type the tokens array
interface Token {
    name: string;
    balance: string;
    icon: string | null; // Icon can now be null
}

// Create a tokens array with typing
const tokens = ref<Token[]>([
    { name: '$TOKEN', balance: '100,000,000', icon: null },
    { name: '$TOKEN', balance: '100,000,000', icon: null },
    { name: '$TOKEN', balance: '100,000,000', icon: null },
    { name: '$TOKEN', balance: '100,000,000', icon: null },
]);

const options: [string, string] = ["From balances", "From allowances"]
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

.label {
    font-size: 16px;
    color: white;
}

.required {
    color: red;
}

.token-item {
    display: flex;
    align-items: center;
    background-color: #181818;
    padding: 16px;
    border-radius: 12px;
    width: 100%;
    transition: background-color 0.3s ease;
}

.token-item:hover {
    background-color: #1f1f1f;
}

.token-icon {
    width: 40px;
    /* Adjust the size of the icon */
    height: 40px;
    margin-right: 16px;
}

.token-icon-circle {
    width: 40px;
    /* Circle size */
    height: 40px;
    border-radius: 50%;
    background-color: #333333;
    /* Color of the circle */
    margin-right: 16px;
}

.token-details {
    display: flex;
    flex-direction: column;
}

.token-name {
    color: white;
}

.token-balance {
    color: #9E9E9E;
    margin-top: 4px;
}
</style>