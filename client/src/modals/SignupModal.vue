<template>
    <ModalBase :show="show" :title="title" :allow-close="false">
        <p>{{ firstLineOfText }}</p>
        <p>{{ lastLineOfText }}</p>
        <template #actions>
            <Web3Button primary-text="Create Wallet" :onClick="requestCreateWallet">Create Wallet</Web3Button>
        </template>
    </ModalBase>
</template>

<script lang="ts" setup>
import ModalBase from './ModalBase.vue';
import { useProfileStore } from '@/stores/profile';
import { randomId } from '@/utils/GalaHelper';
import Web3Button from '@/components/Web3Button.vue';
import { createWallet } from '@/services/BackendApi';

const props = defineProps({
    show: {
        type: Boolean,
        required: true,
    },
    title: {
        type: String,
        default: 'Create Wallet',
    },
});

const { sign, fetchProfile } = useProfileStore();


const firstLineOfText = `It looks like this Ethereum address has not been used to create a GalaChain wallet.`;
const lastLineOfText = `Please click the button below to create a new GalaChain wallet and associate it with the currently connected address.`;
const emit = defineEmits(['update:show']);
const requestCreateWallet = async () => {

    const payload = {
        uniqueKey: 'giveaway-public-key-' + randomId(),
    }
    const signedPayload = await sign("Create Wallet", payload);
    const success = await createWallet(signedPayload);
    if (success) {
        await fetchProfile();
        emit('update:show', false);
    }
};

</script>