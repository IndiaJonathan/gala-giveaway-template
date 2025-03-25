<template>
    <v-list-item-title>
        Claim {{ giveaway.winPerUser }} "{{ tokenToReadable(giveaway.giveawayToken) }}" Tokens
    </v-list-item-title>
    <v-list-item-subtitle>
        {{ giveaway.giveawayType }} </v-list-item-subtitle>
    <v-list-item-subtitle>
        Claims Left: {{ giveaway.claimsLeft }} </v-list-item-subtitle>
    <v-list-item-subtitle>
        {{ getEndDateMessage(giveaway.endDateTime) }}
    </v-list-item-subtitle>
    <v-list-item-subtitle v-if="giveaway.requireBurnTokenToClaim">
        Requires burning {{ giveaway.burnTokenQuantity }} token(s) of:
        {{ tokenToReadable(giveaway.burnToken) }} to claim
    </v-list-item-subtitle>
    <v-list-item-action>
        <div v-if="giveaway.isWinner">
            Claimed! <v-icon class="ml-2">mdi-check-circle</v-icon>
        </div>
        <div v-if="isUserSignedUp">
            Signed Up <v-icon class="ml-2">mdi-check-circle</v-icon>
        </div>
        <div v-else-if="giveaway.telegramAuthRequired">Telegram Auth Required</div>
    </v-list-item-action>
</template>

<script lang="ts" setup>
import type { Giveaway } from '@/views/AvailableGiveaways.vue';
import type { PropType } from 'vue';
import { tokenToReadable } from '@/utils/GalaHelper';
import { getEndDateMessage } from '@/utils/Helpers';

const props = defineProps({
    giveaway: {
        type: Object as PropType<Giveaway>,
        required: true
    },
    isUserSignedUp: {
        type: Boolean,
        default: false,
        required: false
    }
})

</script>