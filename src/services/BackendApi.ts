import type { FullGiveawayDto, Profile, SignupForGiveawayDto } from '@/utils/types'
import type { Giveaway } from '@/views/AvailableGiveaways.vue'
import type { TokenClassBody } from '@gala-chain/api'

// Load the base URL from environment variables
const baseURL = import.meta.env.VITE_TELEGRAM_SERVER

export async function GetAdminQuantityAvailable(tokenClassKey: TokenClassBody, gc_address: string) {
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

  const data: StartGiveawayResponse = await response.json()

  return data
}

// Example usage
// const giveaway: GiveawayDto = {
//   giveawayToken: 'some-token-value',
//   amount: '100',
//   endTime: new Date('2024-12-31T23:59:59Z'),
// };
//
// startGiveaway(giveaway).then(response => {
//   if (response) {
//     console.log('Giveaway started successfully:', response);
//   } else {
//     console.log('Failed to start giveaway');
//   }
// });
