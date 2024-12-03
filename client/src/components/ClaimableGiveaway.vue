<template>
    <v-list-item-title>
        Claim {{ giveaway.claimPerUser || 0 }} "{{ tokenToReadable(giveaway.giveawayToken) }}" Tokens
    </v-list-item-title>
    <v-list-item-subtitle>
        {{ giveaway.giveawayType }} </v-list-item-subtitle>
    <v-list-item-subtitle>
        Winners Possible: {{ giveaway.maxWinners }} </v-list-item-subtitle>
    <v-list-item-subtitle>
        {{ getEndDateMessage(giveaway.endDateTime) }}
    </v-list-item-subtitle>
    <v-list-item-subtitle v-if="giveaway.requireBurnTokenToClaim">
        Requires burning {{ giveaway.burnTokenQuantity }} token(s) of:
        {{ tokenToReadable(giveaway.burnToken) }} to claim
    </v-list-item-subtitle>
    <v-list-item-action>
        <div v-if="isUserSignedUp(giveaway)">
            Signed Up <v-icon class="ml-2">mdi-check-circle</v-icon>
        </div>
        <div v-else-if="giveaway.telegramAuthRequired">Telegram Auth Required</div>
    </v-list-item-action>
</template>

<script lang="ts" setup>
import type { Giveaway } from '@/views/AvailableGiveaways.vue';
import type { PropType } from 'vue';
import { isUserSignedUp, getEndDateMessage } from '@/views/AvailableGiveaways.vue';
import { tokenToReadable } from '@/utils/GalaHelper';

const props = defineProps({
    giveaway: {
        type: Object as PropType<Giveaway>,
        required: true
    }
})

</script>