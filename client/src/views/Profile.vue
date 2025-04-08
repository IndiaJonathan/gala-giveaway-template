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
        <div v-if="!profile.hasTelegramLinked && !tempTelegramUser">
          <telegram-login :disabled="!connectedUserGCAddress" :bot-name="telegramBotUsername"
            @auth="onTelegramAuth"></telegram-login>
        </div>
        <div v-else-if="tempTelegramUser && !profile.hasTelegramLinked">
          <h3 class="white--text">
            Logged in With Telegram as: {{ tempTelegramUser.first_name }}
          </h3>
          <p class="white--text mt-2">Click the button below to link your Telegram account with your wallet.</p>
        </div>
        <div v-else class="mt-5">
          <h3 v-if="profile.hasTelegramLinked" class="white--text">
            Telegram is linked <v-icon left>mdi-check</v-icon>
          </h3>
          
          <v-btn v-if="profile.hasTelegramLinked" color="error" 
            dark large block class="mt-3" @click="unlinkTelegram">
            <v-icon left>mdi-link-variant-off</v-icon>
            Unlink Telegram Account
          </v-btn>
        </div>

        <v-btn v-if="!profile.hasTelegramLinked && tempTelegramUser" :disabled="!connectedUserGCAddress" color="success"
          dark large block class="mt-5" @click="linkWallets">
          <v-icon left>mdi-link-variant</v-icon>
          Link Telegram and Wallet
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
import { ref, type Ref, onMounted } from 'vue'
import TelegramLogin from '../components/TelegramLogin.vue'
import { BrowserConnectClient, TokenApi, TokenBalance } from '@gala-chain/connect'
import { useToast } from '@/composables/useToast'
import { getProfile, unlinkTelegramAccount } from '@/services/BackendApi'
import UserBalances from '../components/UserBalances.vue'
import ClaimableWins from '@/components/ClaimableWins.vue'
import type { ClaimableWinDto } from '@/utils/types'
import { useProfileStore } from '@/stores/profile'
import { storeToRefs } from 'pinia'


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

const tempTelegramUser = ref<TelegramUser | null>(null)

// Check for stored Telegram auth data on mount
onMounted(() => {
  const storedAuthData = sessionStorage.getItem('telegram_auth_data')
  if (storedAuthData) {
    try {
      const authData = JSON.parse(storedAuthData)
      tempTelegramUser.value = authData
      sessionStorage.removeItem('telegram_auth_data')
    } catch (error) {
      console.error('Error parsing stored Telegram auth data:', error)
    }
  }
})

const onTelegramAuth = (user: TelegramUser) => {
  tempTelegramUser.value = user
}

const linkWallets = async () => {
  if (!tempTelegramUser.value || !connectedUserGCAddress.value) {
    showToast('Please connect your wallet and login with Telegram first.', true)
    return
  }

  await connect()

  //Metamask signing seems to have issues with complex objects, so we're just sending data individually

  // Build the data object with required fields
  const dataToSign: Record<string, any> = {
    'GalaChain Address': connectedUserGCAddress.value,
    'Telegram User ID': tempTelegramUser.value.id,
    'Telegram First Name': tempTelegramUser.value.first_name,
    'Telegram Auth Date': tempTelegramUser.value.auth_date,
    'Telegram Hash': tempTelegramUser.value.hash
  }

  // Only add optional fields if they exist
  if (tempTelegramUser.value.last_name) {
    dataToSign['Telegram Last Name'] = tempTelegramUser.value.last_name
  }

  if (tempTelegramUser.value.username) {
    dataToSign['Telegram Username'] = tempTelegramUser.value.username
  }

  if (tempTelegramUser.value.photo_url) {
    dataToSign['Telegram Photo URL'] = tempTelegramUser.value.photo_url
  }

  const signedData = await profileStore.sign('Link GalaChain and Telegram', dataToSign)

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
    let errorMessage = 'Unable to link wallet!';

    if (jsonInfo && typeof jsonInfo.message === 'string') {
      errorMessage = jsonInfo.message
        .replace('already exists', 'already linked')
        .replace('TelegramId', 'Telegram');
    } else if (jsonInfo && jsonInfo.error) {
      errorMessage = typeof jsonInfo.error === 'string' ? jsonInfo.error : 'Error linking wallet';
    }

    showToast(errorMessage, true);
  }
}

const unlinkTelegram = async () => {
  if (!connectedUserGCAddress.value) {
    showToast('Please connect your wallet first.', true)
    return
  }

  try {
    // Create a simple payload with a unique key for the unlink operation
    const dataToSign = {
      'uniqueKey': `unlink-telegram-${Date.now()}`
    }

    // Sign the data with the profile store
    const signedData = await profileStore.sign('Unlink Telegram Account', dataToSign)

    // Call the API to unlink the account
    const success = await unlinkTelegramAccount(signedData)
    
    if (success) {
      // Update the local profile state
      await profileStore.fetchProfile()
      showToast('Telegram account unlinked successfully!')
    }
  } catch (error: any) {
    console.error('Error unlinking Telegram account:', error)
    showToast(error.message || 'Failed to unlink Telegram account.', true)
  }
}

</script>