<template>
  <v-app dark style="width: 100%">
    <v-main style="width: 100%">
      <v-container fluid fill-height class="d-flex align-center justify-center">
        <v-card class="elevation-12 text-center px-5 py-7">
          <v-card-title class="justify-center">
            <h2 class="white--text font-weight-bold">Link Your Telegram and Ethereum Wallets</h2>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text>
            <div v-if="!telegramUser">
              <telegram-login
                :bot-name="telegramBotUsername"
                @auth="onTelegramAuth"
              ></telegram-login>
            </div>
            <div v-else class="mt-5">
              <h3 class="white--text">Logged in With Telegram as: {{ telegramUser.first_name }}</h3>
            </div>

            <v-btn
              v-if="!ethereumAddress"
              color="primary"
              large
              block
              class="mt-5"
              @click="connectEthereumWallet"
            >
              <v-icon left>mdi-wallet</v-icon>
              Connect Ethereum Wallet
            </v-btn>

            <div v-else class="mt-5">
              <h3 class="white--text">Ethereum Address: {{ ethereumAddress }}</h3>
            </div>

            <v-btn
              :disabled="!telegramUser?.id || !ethereumAddress"
              color="success"
              dark
              large
              block
              class="mt-5"
              @click="linkWallets"
            >
              <v-icon left>mdi-link-variant</v-icon>
              Link Wallets
            </v-btn>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.background-image {
  background-size: cover;
  background-position: center;
}

.v-card {
  border-radius: 20px;
}

.v-btn {
  border-radius: 30px;
}

.v-icon {
  margin-right: 8px;
}

h2,
h3 {
  font-family: 'Roboto', sans-serif;
}

@media only screen and (max-width: 600px) {
  .v-card {
    margin: 0 20px;
  }
}
</style>

<script lang="ts" setup>
import { ref } from 'vue'
import TelegramLogin from '../components/TelegramLogin.vue'
import { MetamaskConnectClient } from '@gala-chain/connect'

const w3wConnection = new MetamaskConnectClient()

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

const telegramUser = ref<TelegramUser | null>(null)
const ethereumAddress = ref<string>('')
const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string

const connectEthereumWallet = async () => {
  try {
    const account = await w3wConnection.connect()
    ethereumAddress.value = account
  } catch (error) {
    console.error('User rejected the request:', error)
  }
}

const onTelegramAuth = (user: TelegramUser) => {
  telegramUser.value = user
}

const linkWallets = () => {
  if (!telegramUser.value || !ethereumAddress.value) {
    alert('Please connect all wallets and login with Telegram.')
    return
  }

  const data = {
    telegramUser: telegramUser.value,
    ethereumAddress: ethereumAddress.value
  }

  //TODO
  console.log('Linking wallets:', data)

  alert('Wallets linked successfully!')
}
</script>
