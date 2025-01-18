<template>
    <div>

        <div v-if="grantedAllowanceQuantity" class="text-muted mb-4">
            <p>You have a net allowance of <strong>{{ grantedAllowanceQuantity }}</strong> tokens
                allocated to the giveaway wallet.
            </p>


            <v-alert v-if="BigNumber(grantedAllowanceQuantity).gte(requiredAmount)" type="success" dense outlined
                class="mb-4">
                You have sufficient allowance to start the giveaway.
            </v-alert>
            <div v-else class="text-muted mb-4">
                <p>
                    You need to grant an additional
                    <strong> {{ requiredAmount.minus(grantedAllowanceQuantity) }} </strong>
                    tokens to meet the requirement.
                </p>
                <v-btn color="primary" @click="grantAdditionalAllowance" class="mt-2">
                    Grant Additional Allowance
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
import {
    type TokenClassKeyProperties
} from '@gala-chain/api'
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
    requiredAmount: {
        type: BigNumber,
        required: true
    },
    grantedAllowanceQuantity: {
        type: BigNumber,
        required: true
    }
})


const emit = defineEmits<{
    (e: 'allowanceGranted'): void
}>()


async function grantAdditionalAllowance() {
    const browserClient = new BrowserConnectClient();
    await browserClient.connect()

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

            const grant = await tokenService.grantAllowance(
                props.giveawaySettings.giveawayToken,
                props.requiredAmount.minus(new BigNumber(props.grantedAllowanceQuantity)),
                profile.value.giveawayWalletAddress
            )
            if (grant.Status === 1) {
                // Success!
                showToast('Allowance Granted!')
                emit('allowanceGranted')
            }
        } catch (e: unknown) {
            let errorMessage = 'unknown error';
            if (isErrorWithMessage(e)) {
                errorMessage = e.Message
            }
            console.error(errorMessage)
            showToast(`Unable to grant allowance. Error: ${errorMessage}`, true);
        }
    }
}

</script>