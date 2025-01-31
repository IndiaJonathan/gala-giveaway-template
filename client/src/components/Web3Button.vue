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
    onClick: () => Promise<any>
    className?: string
}

const props = defineProps<Web3ButtonProps>()

const profileStore = useProfileStore()
const { isAwaitingSign, isAwaitingConnect, connectedEthAddress } = storeToRefs(profileStore)

const isLoading = ref(false)

const openDialog = useDialog().openDialog;




const computedValues = computed(() => {
    if (isAwaitingConnect.value) {
        return {
            buttonText: 'Unlock Your Web3 Provider',
        }
    }

    if (!connectedEthAddress.value) {
        return {
            buttonText: props.connectWalletText || 'Connect Wallet',
            handleClick: async () => {
                try {
                    await profileStore.connect();

                    isLoading.value = true
                    await props.onClick()
                } catch (e: any) {
                    // Handle "web3 provider not found" error
                    if (e?.message?.includes(ErrorCode.WEB3_PROVIDER_NOT_FOUND)) {
                        openNoWeb3WalletDialog()
                    }
                    // TODO: handle other errors if necessary
                } finally {
                    isLoading.value = false
                }
            },
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
        isLoading.value = true
        await props.onClick()
    } finally {
        isLoading.value = false
    }
};
</script>

<template>
    <v-btn :disabled="isLoading" @click="handleClick">
        <template v-if="isLoading">
            <v-progress-circular indeterminate></v-progress-circular>
        </template>
        <span>{{ buttonText }}</span>
    </v-btn>
</template>
