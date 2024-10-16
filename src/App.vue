<!-- App.vue -->
<template>
  <div id="app">
    <router-view></router-view>

    <v-snackbar
      v-model="toast.visible"
      :timeout="toast.timeout"
      :color="toast.isError ? 'error' : 'success'"
    >
      {{ toast.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="toast.visible = false"> Close </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { useToast } from '@/composables/useToast'
import { nextTick } from 'vue'

const { toast, showToast } = useToast()
</script>
