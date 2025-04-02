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
              class="mt-4"
            ></v-progress-circular>
            <div v-if="userName" class="text-center mt-4">
              <p>Successfully authenticated!</p>
              <v-btn
                color="primary"
                class="mt-4"
                @click="returnToOriginalPage"
              >
                Continue
              </v-btn>
            </div>
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

const returnToOriginalPage = () => {
  const returnPath = sessionStorage.getItem('telegram_auth_return_path') || '/'
  sessionStorage.removeItem('telegram_auth_return_path')
  router.push(returnPath)
}

const handleTelegramAuth = async () => {
  // Check for Telegram auth data in URL
  const urlParams = new URLSearchParams(window.location.search)
  let authData = Object.fromEntries(urlParams.entries())
  
  if (!Object.keys(authData).length) {
    // If no query params, check for hash data
    const hash = window.location.hash
    if (hash && hash.includes('tgAuthResult=')) {
      const tgAuthResult = hash.split('tgAuthResult=')[1]
      try {
        const decodedData = JSON.parse(atob(tgAuthResult))
        authData = decodedData
      } catch (error) {
        console.error('Error decoding hash data:', error)
        authError.value = `Failed to decode auth data: ${error}`
        loading.value = false
        return
      }
    }
  }

  if (!Object.keys(authData).length) {
    authError.value = 'No authentication data found.'
    loading.value = false
    return
  }

  try {
    // Set the user name for display
    userName.value = authData.first_name || 'User'
    
    // If we're in a popup, send message to parent
    if (window.opener) {
      window.opener.postMessage(JSON.stringify({
        event: 'auth_result',
        result: authData
      }), window.location.origin)
    } else {
      // For mobile flow, store the auth data and redirect back
      sessionStorage.setItem('telegram_auth_data', JSON.stringify(authData))
      returnToOriginalPage()
    }
  } catch (error) {
    console.error('Auth error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    authError.value = `Authentication error: ${errorMessage}`
  } finally {
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
