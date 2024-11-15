<template>
  <v-container fluid fill-height class="d-flex align-center justify-center">
    <v-card class="elevation-12 text-center px-5 py-7">
      <v-card-title class="justify-center">
        <h2 class="white--text font-weight-bold">Your Profile</h2>
      </v-card-title>

      <v-divider></v-divider>

      <v-btn v-if="!galaChainAddress" color="primary" large block class="mt-5" @click="connectEthereumWallet">
        <v-icon left>mdi-wallet</v-icon>
        Connect Ethereum Wallet
      </v-btn>

      <div v-else class="mt-5">
        <h3 class="white--text">Ethereum Address: {{ galaChainAddress }}</h3>
      </div>

      <v-card-text>
        <div v-if="!telegramUser && !telegramUserLinked">
          <telegram-login :disabled="!galaChainAddress" :bot-name="telegramBotUsername"
            @auth="onTelegramAuth"></telegram-login>
        </div>
        <div v-else class="mt-5">
          <h3 v-if="telegramUser && !telegramUserLinked" class="white--text">
            Logged in With Telegram as: {{ telegramUser.first_name }}
          </h3>
          <h3 v-else="telegramUser" class="white--text">
            Telegram is linked <v-icon left>mdi-check</v-icon>
          </h3>
        </div>

        <v-btn v-if="!telegramUserLinked" :disabled="!telegramUser?.id || !galaChainAddress" color="success" dark large
          block class="mt-5" @click="linkWallets">
          <v-icon left>mdi-link-variant</v-icon>
          Link Wallets
        </v-btn>
      </v-card-text>

      <div v-if="giveawayWallet" class="mt-5">
        <h3 class="white--text">Your Giveaway Wallet Address: {{ giveawayWallet }}</h3>
      </div>
    </v-card>
  </v-container>

  <UserBalances v-if="galaChainAddress" :data="balances"> </UserBalances>
  <ClaimableWins v-if="claimableWins" :balances="balances" v-on:reload="load()" :data="claimableWins">
  </ClaimableWins>
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

const telegramUser = ref<TelegramUser | null>(null)
const telegramUserLinked = ref(false)
const giveawayWallet: Ref<string | null> = ref(null)
const galaChainAddress = ref<string>('')
const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string
const telegramServer = import.meta.env.VITE_TELEGRAM_SERVER
const { showToast } = useToast()
const tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL
const browserClient = new BrowserConnectClient()
let balances: Ref<TokenBalance[]> = ref([])
let claimableWins: Ref<ClaimableWinDto[]> = ref([])

const connectEthereumWallet = async () => {
  try {
    const account = await w3wConnection.connect()
    galaChainAddress.value = account
    load();
  } catch (error) {
    console.error('User rejected the request:', error)
  }
}

const onTelegramAuth = (user: TelegramUser) => {
  telegramUser.value = user
}

const linkWallets = async () => {
  if (!telegramUser.value || !galaChainAddress.value) {
    showToast('Please connect all wallets and login with Telegram.', true)
    return
  }

  await connectEthereumWallet()
  const signedData = await w3wConnection.sign('Link GalaChain and Telegram', {
    'GalaChain Address': galaChainAddress.value,
    ...(telegramUser.value as any)
  })

  console.log('Linking wallets:', signedData)

  const linkResult = await fetch(`${telegramServer}/api/profile/link-accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedData)
  })

  if (linkResult.ok) {
    telegramUserLinked.value = true
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

async function load() {
  const currentAddress = await getConnectedAddress()
  if (currentAddress) {
    galaChainAddress.value = currentAddress.replace('0x', 'eth|')
    const profile = await getProfile(galaChainAddress.value)
    claimableWins.value = profile.claimableWins
    telegramUserLinked.value = profile.hasTelegramLinked
    giveawayWallet.value = profile.giveawayWalletAddress
    const tokenApi = new TokenApi(tokenContractUrl, browserClient)
    balances.value = ((await tokenApi.FetchBalances({ owner: currentAddress })) as any).Data
  }
}
load()
</script>