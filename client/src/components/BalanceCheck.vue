<template>
    <div>
        <div v-if="adminBalanceQuantity" class="text-muted mb-4">
            <p>You have a net balance of <strong>{{ adminBalanceQuantity }}</strong> tokens
                in the giveaway wallet.
            </p>

            <v-alert v-if="BigNumber(adminBalanceQuantity).gte(requiredAmount)" type="success" dense outlined
                class="mb-4">
                The giveaway wallet has sufficient balance to start the giveaway.
            </v-alert>
            <div v-else class="text-muted mb-4">
                <p>
                    You need to transfer an additional
                    <strong> {{ requiredAmount.minus(adminBalanceQuantity) }} </strong>
                    tokens to meet the requirement.
                </p>
                <v-btn color="primary" @click="transferToken" class="mt-2">
                    Transfer Token
                </v-btn>
            </div>
        </div>
        <div v-else class="text-muted mb-4">
            <p>You have not granted any allowance of this token to the giveaway wallet yet.</p>
        </div>
    </div>

</template>



<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { GalaChainApi } from '@/services/GalaChainApi'
import BigNumber from "bignumber.js";
import { computed, ref, watch, type PropType, type Ref } from 'vue'
import { getRequiredAmountForFCFS, type GiveawayAllowances, type GiveawaySettingsDto } from '@/utils/types'
import { BrowserConnectClient } from '@gala-chain/connect'
import { GALA } from '@/utils/constants';
import { BadRequestError } from '@tonconnect/sdk';
import { isErrorWithMessage } from '@/utils/Helpers';
import { useProfileStore } from '@/stores/profile';
import { storeToRefs } from 'pinia';


const profileStore = useProfileStore();
const { profile } = storeToRefs(profileStore)

const { showToast } = useToast()


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
    (e: 'tokenTransfered'): void
}>()


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
                showToast('Token transfered!')
                emit('tokenTransfered')
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