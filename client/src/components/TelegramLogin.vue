<!-- src/components/TelegramLogin.vue -->
<template>
  <v-btn color="primary" class="telegram-button" large block @click="onTelegramLogin">
    <v-icon left>mdi-telegram</v-icon>
    LOGIN WITH TELEGRAM
  </v-btn>
</template>

<script lang="ts" setup>
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

const onTelegramLogin = () => {
  // Create a popup window for Telegram authentication
  const width = 550
  const height = 520
  const left = (screen.width - width) / 2
  const top = (screen.height - height) / 2

  const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=${botID}&origin=${encodeURIComponent(
    window.location.origin
  )}&embed=0&request_access=write`

  const authWindow = window.open(
    telegramAuthUrl,
    'TelegramAuth',
    `width=${width},height=${height},top=${top},left=${left},status=no,scrollbars=no,resizable=no`
  )

  // Listen for messages from the popup
  window.addEventListener('message', async function handleMessage(event) {
    const eventData = JSON.parse(event.data)

    if (eventData.event === 'auth_result' && eventData.result) {
      emit('auth', eventData.result)
      window.removeEventListener('message', handleMessage)
      authWindow?.close() // Optionally close the popup window after auth
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
