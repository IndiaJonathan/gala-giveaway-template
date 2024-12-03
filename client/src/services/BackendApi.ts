import { useToast } from '@/composables/useToast'
import type { BasicGivewaySettingsDto, ClaimableWinDto, ClaimFCFSDto, GiveawayBalances, Profile, SignupForGiveawayDto, StartBasicGivewaySettingsDto } from '@/utils/types'
import type { Giveaway } from '@/views/AvailableGiveaways.vue'
import type { GalaChainResponse, TokenClassKeyProperties } from '@gala-chain/api'
import type { BurnTokensRequest, GalaChainResponseSuccess, TokenBalance } from '@gala-chain/connect'
import type BigNumber from 'bignumber.js'

const baseURL = import.meta.env.VITE_TELEGRAM_SERVER

export async function GetGiveawayBalances(
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

  const data: GiveawayBalances = await response.json()

  if (data) {
    return data
  }

  return undefined
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

export async function getGiveaways(gcAddress: string): Promise<Giveaway[]> {
  const { showToast } = useToast()

  const response = await fetch(`${baseURL}/api/giveaway/all`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'GC-Address': gcAddress
    }
  })

  if (!response.ok) {
    const message = await response.text()
    showToast(message, true)
    throw new Error(message)
  }

  const data = await response.json()

  return data
}
export async function getActiveGiveaways(): Promise<Giveaway[]> {
  const { showToast } = useToast()

  const response = await fetch(`${baseURL}/api/giveaway/active`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const message = await response.text()
    showToast(message, true)
    throw new Error(message)
  }

  const data = await response.json()

  return data
}

export async function claimWin(win: BurnTokensRequest & { claimId: string }) {
  const response = await fetch(`${baseURL}/api/giveaway/randomgiveaway/claim`, {
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

export async function requestClaimFCFS(claim: ClaimFCFSDto) {
  const response = await fetch(`${baseURL}/api/giveaway/fcfs/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(claim)
  })

  if (!response.ok) {
    const message = await response.json()
    throw message?.error || 'Unable to claim'
  }

  const data = await response.json()

  return data
}

export async function startGiveaway(giveaway: StartBasicGivewaySettingsDto) {
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
