import type { TokenAllowance } from '@gala-chain/api'
import { getAddress } from 'ethers'

export function getGalaChainAddress(ethAddress: string) {
  return ethAddress.replace('0x', 'eth|')
}

export function getTokenKey(allowance: TokenAllowance) {
  return `${allowance.collection}|${allowance.category}|${allowance.type}|${allowance.additionalKey}`
}

export function getTokenKeyFromString(delimitedString: string) {
  const delimited = delimitedString.split('|')
  if (delimited.length != 4) return undefined
  return {
    collection: delimited[0],
    category: delimited[1],
    type: delimited[2],
    additionalKey: delimited[3]
  }
}

export async function getConnectedAddress() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Get the list of connected accounts (this won't prompt the user)
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })

      // If there is at least one account connected
      if (accounts.length > 0) {
        const connectedAddress = getAddress(accounts[0])
        return connectedAddress.replace('0x', 'eth|')
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting connected account:', error)
      return null
    }
  } else {
    console.log('No Ethereum provider found')
    return null
  }
}
