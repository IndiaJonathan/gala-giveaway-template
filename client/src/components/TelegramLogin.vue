<!-- src/components/TelegramLogin.vue -->
<template>
  <div>
    <v-btn color="primary" class="telegram-button" large block @click="onTelegramLogin">
      <v-icon left>mdi-telegram</v-icon>
      LOGIN WITH TELEGRAM
    </v-btn>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const botID = import.meta.env.VITE_BOT_ID

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

const props = defineProps<{
  botName: string
}>()

const emit = defineEmits<{
  (e: 'auth', user: TelegramUser): void
}>()

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|MetaMask/i.test(navigator.userAgent)
}

const onTelegramLogin = () => {
  const returnUrl = `${window.location.origin}/telegram-callback`
  
  const baseUrl = `https://oauth.telegram.org/auth?bot_id=${botID}&origin=${encodeURIComponent(
    window.location.origin
  )}&request_access=write`

  if (isMobile()) {
    const mobileUrl = `${baseUrl}&embed=1&return_to=${encodeURIComponent(returnUrl)}`
    sessionStorage.setItem('telegram_auth_return_path', window.location.pathname)
    window.location.href = mobileUrl
    return
  }

  const desktopUrl = `${baseUrl}&return_to=${encodeURIComponent(returnUrl)}`
  
  const width = 550
  const height = 520
  const left = (screen.width - width) / 2
  const top = (screen.height - height) / 2

  const authWindow = window.open(
    desktopUrl,
    'TelegramAuth',
    `width=${width},height=${height},top=${top},left=${left},status=no,scrollbars=no,resizable=no`
  )

  window.addEventListener('message', async function handleMessage(event) {
    if (!event.data) return
    
    try {
      const eventData = JSON.parse(event.data)
      if (eventData.event === 'auth_result' && eventData.result) {
        emit('auth', eventData.result)
        window.removeEventListener('message', handleMessage)
        authWindow?.close()
      }
    } catch (error) {
      console.error('Error processing Telegram auth message:', error)
    }
  })
}
</script>

<style scoped>
.telegram-button {
  color: white;
  font-weight: bold;
  border-radius: 30px;
  text-transform: none;
}

.telegram-button .v-icon {
  font-size: 24px;
}

.telegram-button:hover {
  background-color: #0077b5;
}

.telegram-button .v-btn__content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-icon.mdi-telegram {
  margin-right: 8px;
}
</style>
