import { useToast } from '@/composables/useToast'
import type { BalanceResponseDto } from '@/dto/BalanceResponseDto'
import type { Giveaway } from '@/types/giveaway'
import type { SignedDto } from '@/types/web3'
import {
  type ClaimableWinDto,
  type ClaimFCFSDto,
  type GasFeeEstimateRequestDto,
  type Profile,
  type SignupForGiveawayDto,
  type StartBasicGivewaySettingsDto,
  type TokenBalances,
  type UserWonGiveawaysResponseDto
} from '@/utils/types'
import type { TokenClassKeyProperties } from '@gala-chain/api'
import type { BurnTokensRequest } from '@gala-chain/connect'

const baseURL = import.meta.env.VITE_TELEGRAM_SERVER



// export async function getGiveawayTokensAvailable(
//   tokenClassKey: TokenClassKeyProperties,
//   gc_address: string | undefined,
//   giveawayTokenType: string
// ): Promise<TokenBalances | undefined> {
//   if (!gc_address) {
//     throw new Error('GalaChain address is required')
//   }

//   console.log("Getting tokens available for", gc_address, tokenClassKey, giveawayTokenType)
//   const response = await fetch(`${baseURL}/api/giveaway/tokens-available/${gc_address}`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       tokenInstanceKey: { ...tokenClassKey, instance: '0' },
//       tokenType: giveawayTokenType
//     })
//   })

//   if (!response.ok) {
//     throw new Error('Network response was not ok')
//   }

//   const data = await response.json()
//   return data
// }

export async function createWallet(payload: SignedDto) {
  const response = await fetch(`${baseURL}/api/wallet/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      operation: 'set-giveaway-public-key',
      payload
    })
  })

  if (response.ok) {
    return true
  }

  return false
}


export async function fetchBalances(gc_address: string): Promise<BalanceResponseDto> {
  const response = await fetch(`${baseURL}/api/profile/balances/${gc_address}`, {
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

export async function getGiveaways(gcAddress?: string): Promise<Giveaway[]> {
  const { showToast } = useToast()

  const response = await fetch(`${baseURL}/api/giveaway/all`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(gcAddress && { 'GC-Address': gcAddress })
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


//TODO: Remove this later
// export async function getGiveawayGasFee(giveaway: GasFeeEstimateRequestDto) {
//   const response = await fetch(`${baseURL}/api/giveaway/estimate-fee`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(giveaway)
//   })

//   if (!response.ok) {
//     const message = await response.json()
//     throw message?.error || 'Unable to start giveway'
//   }

//   const data = await response.json()

//   return data
// }

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

export async function getClaimableWins(gcAddress: string | undefined): Promise<ClaimableWinDto[]> {
  if (!gcAddress) {
    throw new Error('GalaChain address is required')
  }

  const response = await fetch(`${baseURL}/api/giveaway/user-wins/${gcAddress}`, {
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

export async function getCreatedGiveaways(gcAddress: string | undefined) {
  if (!gcAddress) {
    throw new Error('GalaChain address is required')
  }

  const response = await fetch(`${baseURL}/api/profile/created-giveaways/${gcAddress}`, {
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

export async function unlinkTelegramAccount(payload: SignedDto) {
  const response = await fetch(`${baseURL}/api/profile/unlink-accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const message = await response.json()
    throw message?.error || 'Unable to unlink Telegram account'
  }

  return true
}
