<template>
  <v-container v-if="profile" fluid fill-height class="d-flex align-center justify-center">
    <v-card class="elevation-12 text-center px-5 py-7">
      <v-card-title class="justify-center">
        <h2 class="white--text font-weight-bold">Your Profile</h2>
      </v-card-title>

      <v-divider></v-divider>

      <v-btn v-if="!connectedUserGCAddress" color="primary" large block class="mt-5" @click="connect">
        <v-icon left>mdi-wallet</v-icon>
        Connect Ethereum Wallet
      </v-btn>

      <div v-else class="mt-5">
        <h3 class="white--text">Ethereum Address: {{ connectedEthAddress }}</h3>
      </div>

      <v-card-text>
        <div v-if="!profile.hasTelegramLinked">
          <telegram-login :disabled="!connectedUserGCAddress" :bot-name="telegramBotUsername"
            @auth="onTelegramAuth"></telegram-login>
        </div>
        <div v-else-if="tempTelegramUser">
          <h3 class="white--text">
            Logged in With Telegram as: {{ tempTelegramUser.first_name }}
          </h3>
        </div>
        <div v-else class="mt-5">
          <h3 v-if="profile.hasTelegramLinked" class="white--text">
            Telegram is linked <v-icon left>mdi-check</v-icon>
          </h3>
        </div>

        <v-btn v-if="!profile.hasTelegramLinked" :disabled="!connectedUserGCAddress" color="success" dark large block
          class="mt-5" @click="linkWallets">
          <v-icon left>mdi-link-variant</v-icon>
          Link Wallets
        </v-btn>
      </v-card-text>

      <div v-if="profile?.giveawayWalletAddress" class="mt-5">
        <h3 class="white--text">Your Giveaway Wallet Address: {{ profile?.giveawayWalletAddress }}</h3>
      </div>
    </v-card>
  </v-container>

  <UserBalances v-if="connectedUserGCAddress" :data="balances"> </UserBalances>
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
import { ref, type Ref } from 'vue'
import TelegramLogin from '../components/TelegramLogin.vue'
import { BrowserConnectClient, TokenApi, TokenBalance } from '@gala-chain/connect'
import { useToast } from '@/composables/useToast'
import { getConnectedAddress } from '@/utils/GalaHelper'
import { getProfile } from '@/services/BackendApi'
import UserBalances from '../components/UserBalances.vue'
import ClaimableWins from '@/components/ClaimableWins.vue'
import type { ClaimableWinDto } from '@/utils/types'
import { useProfileStore } from '@/stores/profile'
import { storeToRefs } from 'pinia'

const w3wConnection = new BrowserConnectClient()

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string
const telegramServer = import.meta.env.VITE_TELEGRAM_SERVER
const { showToast } = useToast()
let claimableWins: Ref<ClaimableWinDto[]> = ref([])

const profileStore = useProfileStore();
const { connect } = profileStore
const { connectedUserGCAddress, connectedEthAddress, profile, balances, } = storeToRefs(profileStore)

const onTelegramAuth = (user: TelegramUser) => {
  tempTelegramUser.value = user
}

const tempTelegramUser = ref<TelegramUser | null>(null)

const linkWallets = async () => {
  if (!profile.value?.hasTelegramLinked || !connectedUserGCAddress.value) {
    showToast('Please connect all wallets and login with Telegram.', true)
    return
  }


  await connect()
  const signedData = await w3wConnection.sign('Link GalaChain and Telegram', {
    'GalaChain Address': connectedUserGCAddress.value,
    ...(profile.value?.hasTelegramLinked as any)
  })

  console.log('Linking wallets:', signedData)

  const linkResult = await fetch(`${telegramServer}/api/profile/link-accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedData)
  })

  if (linkResult.ok) {
    profileStore.setTelegramUserLinked(true)
    showToast('Wallets linked successfully!')
  } else {
    const jsonInfo = await linkResult.json()
    showToast(
      jsonInfo.message
        .replace('already exists', 'already linked')
        .replace('TelegramId', 'Telegram') || 'Unable to link wallet!',
      true
    )
  }
}

</script>