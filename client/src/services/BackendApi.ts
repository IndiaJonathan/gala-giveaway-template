import type { ClaimableWinDto, FullGiveawayDto, Profile, SignupForGiveawayDto } from '@/utils/types'
import type { Giveaway } from '@/views/AvailableGiveaways.vue'
import type { TokenClassKeyProperties } from '@gala-chain/api'
import type { BurnTokensRequest } from '@gala-chain/connect'

const baseURL = import.meta.env.VITE_TELEGRAM_SERVER

export async function GetAdminQuantityAvailable(
  tokenClassKey: TokenClassKeyProperties,
  gc_address: string
) {
  const response = await fetch(`${baseURL}/api/wallet/allowance-available/${gc_address}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tokenClassKey)
  })

  if (!response.ok) {
    throw new Error('Network response was not ok')
  }

  const data: {
    totalQuantity: string
    unuseableQuantity: string
    giveawayWallet: string
  } = await response.json()

  if (data) {
    return data
  }

  return null
}

export async function getProfile(gc_address: string): Promise<Profile> {
  const response = await fetch(`${baseURL}/api/profile/info/${gc_address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message)
  }

  const data = await response.json()

  return data
}

export async function getGiveaways(): Promise<Giveaway[]> {
  const response = await fetch(`${baseURL}/api/giveaway/active`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message)
  }

  const data = await response.json()

  return data
}

export async function claimWin(win: BurnTokensRequest & { claimId: string }) {
  const response = await fetch(`${baseURL}/api/giveaway/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(win)
  })

  if (!response.ok) {
    const message = await response.json()
    throw message?.error || 'Unable to claim'
  }

  const data = await response.json()

  return data
}

export async function startGiveaway(giveaway: FullGiveawayDto) {
  const response = await fetch(`${baseURL}/api/giveaway/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(giveaway)
  })

  if (!response.ok) {
    const message = await response.json()
    throw message?.error || 'Unable to start giveway'
  }

  const data = await response.json()

  return data
}

export async function signupForGiveaway(signupForGiveawayDto: SignupForGiveawayDto) {
  const response = await fetch(`${baseURL}/api/giveaway/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(signupForGiveawayDto)
  })

  if (!response.ok) {
    const message = await response.json()
    throw message
  }

  const data = await response.json()

  return data
}