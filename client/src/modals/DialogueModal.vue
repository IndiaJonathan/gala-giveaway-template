<template>
    <ModalBase :show="show" title="Create Wallet" :allow-close="false">
        <h1>Web3 provider not found</h1>
        <p>Please install a web3 wallet provider to connect a wallet. We recommend MetaMask, a popular and secure Web3
            wallet that works as a browser extension or mobile app.</p>
        <template #actions>
            <v-btn @click="openMetamask">Get Metamask</v-btn>
        </template>
    </ModalBase>
</template>

<script lang="ts" setup>
import ModalBase from './ModalBase.vue';

const props = defineProps({
    show: {
        type: Boolean,
        required: true,
    },
});
</script>