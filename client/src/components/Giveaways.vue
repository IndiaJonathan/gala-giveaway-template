<template>
  <v-item-group>
    <v-container max-width="1024px">
      <v-row>
        <v-col v-for="giveaway of giveaways" :key="giveaway._id" cols="12" sm="6" md="4">
          <v-item>
            <GiveawayCard :giveaway="giveaway" />
          </v-item>
        </v-col>
      </v-row>
    </v-container>
  </v-item-group>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue'
import type { Giveaway } from '@/types/giveaway'
import GiveawayCard from '@/components/Giveaway.vue'

const { giveaways } = defineProps({
  giveaways: {
    type: Array as PropType<Giveaway[]>,
    required: true
  }
})
</script>
