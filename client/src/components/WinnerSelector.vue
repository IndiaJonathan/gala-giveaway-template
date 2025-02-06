<template>
    <div class="token-selection">

        <h5 style="margin-bottom: 12px;" for="token"> Winner type <span class="required">*</span></h5>
        <p style="margin-bottom: 32px;" class="explanatory-text"> Lorem ipsum dolor sit amet, consectetur adipiscing
            elit. Curabitur iaculis pharetra lectus quis dictum. Etiam vulputate orci vel orci auctor pellentesque. </p>

        <ToggleSwitch :options="['1st come, 1st served', 'Raffle']"></ToggleSwitch>

        <div class="container">
            <div class="row">
                <div class="info-item">
                    <span class="subtitle">$TOKEN BALANCE</span>
                    <span class="paragraph-small-regular">{{ tokenBalance }}</span>
                </div>
                <div class="info-item">
                    <span class="subtitle">$TOKEN PRIZE POOL</span>
                    <span class="paragraph-small-regular">{{ tokenPrizePool }}</span>
                </div>
                <div class="info-item">
                    <span class="subtitle">EST. $GALA GAS FEE</span>
                    <span class="paragraph-small-regular">{{ gasFee }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import ToggleSwitch from './ToggleSwitch.vue';

// Define a Token interface to type the tokens array
interface Token {
    name: string;
    balance: string;
    icon: string | null;
}

const tokenBalance = ref('100,000,000');
const tokenPrizePool = ref('0');
const gasFee = ref('0');

// Create a tokens array with typing
const tokens = ref<Token[]>([
    { name: '$TOKEN', balance: '100,000,000', icon: null },
    { name: '$TOKEN', balance: '100,000,000', icon: null },
    { name: '$TOKEN', balance: '100,000,000', icon: null },
    { name: '$TOKEN', balance: '100,000,000', icon: null },
]);
</script>

<style scoped>
.explanatory-text {
    font-size: 16px;
    font-weight: 400;
    line-height: 20px;
    text-align: left;
    text-underline-position: from-font;
    text-decoration-skip-ink: none;
    color: rgba(255, 255, 255, 0.6);
}


.subtitle {
    font-size: 10px;
    font-weight: 500;
    line-height: 16px;
    text-align: left;
    text-underline-position: from-font;
    text-decoration-skip-ink: none;
    color: rgba(158, 158, 158, 1);
}




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


.container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    gap: 32px;
    height: 77px;
}

.row {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-right: 32px;
}

.value {
    font-size: 18px;
    font-weight: bold;
    color: white;
}
</style>