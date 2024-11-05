<template>
  <v-container>
    <v-row justify="center" class="mt-5">
      <v-col cols="12" md="6" lg="4">
        <v-card>
          <v-card-title class="text-center">
            <h2 v-if="userName">Hello, {{ userName }}!</h2>
            <h2 v-else>Authenticating with Telegram...</h2>
          </v-card-title>
          <v-card-text>
            <p v-if="authError" class="red--text text-center mt-4">
              {{ authError }}
            </p>
            <v-progress-circular
              v-else-if="loading"
              indeterminate
              color="primary"
            ></v-progress-circular>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const telegramServer = import.meta.env.VITE_TELEGRAM_SERVER

// State variables
const loading = ref(true)
const authError = ref<string | null>(null)
const userName = ref<string | null>(null)
const router = useRouter()
const bypass = false

const handleTelegramAuth = async () => {
  // Extract the tgAuthResult from the URL
  const hash = window.location.hash
  const tgAuthResult = hash.split('tgAuthResult=')[1]

  if (!tgAuthResult) {
    authError.value = 'No authentication result found.'
    loading.value = false
    return
  }

  try {
    // Decode the base64 tgAuthResult
    const decodedData = JSON.parse(atob(tgAuthResult))

    if (bypass) {
      userName.value = decodedData.first_name
      loading.value = false
    } else {
      const response = await fetch(`${telegramServer}/api/verify-telegram-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decodedData)
      })

      const result = await response.json()

      if (result.success) {
        // If successful, display the user's first name
        userName.value = decodedData.first_name
        loading.value = false
      } else {
        authError.value = 'Authentication failed. Please try again.'
        loading.value = false
      }
    }
    // Send the decoded data to the server
  } catch (error) {
    authError.value = 'An error occurred during authentication.'
    console.warn(error)
    loading.value = false
  }
}

onMounted(() => {
  handleTelegramAuth()
})
</script>

<style scoped>
.v-progress-circular {
  margin: 0 auto;
  display: block;
}
</style>
