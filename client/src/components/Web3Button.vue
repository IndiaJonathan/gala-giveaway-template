<script setup lang="ts">
import { openNoWeb3WalletDialog, useDialog } from '@/composables/useDialogue'
import { useToast } from '@/composables/useToast'
import { useProfileStore } from '@/stores/profile'
import { ErrorCode } from '@/types/error'
import { storeToRefs } from 'pinia'
import { ref, computed } from 'vue'

interface Web3ButtonProps {
    primaryText: string
    connectWalletText?: string
    onClick?: () => Promise<any>
    className?: string
}

const props = defineProps<Web3ButtonProps>()

const profileStore = useProfileStore()
const { connectedEthAddress } = storeToRefs(profileStore)

const isLoading = ref(false)

const openDialog = useDialog().openDialog;


const isAwaitingConnect = ref(false)
const isAwaitingSign = ref(false)


const computedValues = computed(() => {
    if (isAwaitingConnect.value) {
        return {
            buttonText: 'Unlock Your Web3 Provider',
        }
    }

    if (!connectedEthAddress.value) {
        return {
            buttonText: props.connectWalletText || 'Connect Wallet',
        }
    }

    if (isAwaitingSign.value) {
        return {
            buttonText: "Awaiting Sign In wallet",
        }
    }

    // Default case: connected wallet, not awaiting sign
    return {
        buttonText: props.primaryText,
    }
})

// Convenience getters for button text and click handler
const buttonText = computed(() => computedValues.value.buttonText)

const handleClick = async () => {
    try {
        isAwaitingConnect.value = true
        isAwaitingSign.value = true
        await profileStore.connect();
        isAwaitingConnect.value = false
        if (props.onClick) {
            isLoading.value = true
            await props.onClick()
        }
    } catch (e: any) {
        // Handle "web3 provider not found" error
        if (e?.message?.includes(ErrorCode.WEB3_PROVIDER_NOT_FOUND)) {
            openNoWeb3WalletDialog()
        }
    } finally {
        isLoading.value = false
        isAwaitingConnect.value = false
        isAwaitingSign.value = false
    }
};
</script>

<template>
    <v-btn :disabled="isLoading" rounded="pill" height="44px" color="#000" class="connect-wallet-btn" flat
        @click="handleClick">
        <template v-if="isLoading">
            <v-progress-circular indeterminate></v-progress-circular>
        </template>
        <span>{{ buttonText }}</span>
    </v-btn>
</template>


<style scoped>
.connect-wallet-btn {
    background-color: white !important;
    color: black !important;
    font-weight: 600;
    height: 44px;
    border-radius: 50px;
    text-transform: none;
}
</style>