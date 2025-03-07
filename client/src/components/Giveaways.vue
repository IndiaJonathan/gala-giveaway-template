<template>
  <v-container class="giveaways-container px-4" max-width="1280px">
    <div v-if="giveaways.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey">mdi-package-variant-closed</v-icon>
      <h3 class="mt-4 text-grey">No giveaways available</h3>
    </div>
    
    <v-row v-else class="giveaways-grid">
      <v-col 
        v-for="giveaway of giveaways" 
        :key="giveaway._id" 
        cols="12" sm="6" md="4" lg="3"
        class="giveaway-item"
      >
        <GiveawayCard :giveaway="giveaway" @signup-success="$emit('signup-success')" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue'
import type { Giveaway } from '@/types/giveaway'
import GiveawayCard from '@/components/Giveaway.vue'

const emit = defineEmits(['signup-success'])

const { giveaways } = defineProps({
  giveaways: {
    type: Array as PropType<Giveaway[]>,
    required: true
  }
})
</script>

<style scoped>
.giveaways-container {
  padding-top: 24px;
  padding-bottom: 48px;
}

.giveaways-grid {
  margin: 0;
}

.giveaway-item {
  display: flex;
  justify-content: center;
}
</style>
