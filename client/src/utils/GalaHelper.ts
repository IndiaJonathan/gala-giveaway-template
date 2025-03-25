import { TokenClassKey, type TokenAllowance, type TokenClassKeyProperties } from '@gala-chain/api'
import { getAddress } from 'ethers'

export function checkTokenEquivalancy(token1: TokenClassKeyProperties, token2: TokenClassKeyProperties) {
  return tokenToReadable(token1) === tokenToReadable(token2)
}
export function tokenToReadable(token: TokenClassKeyProperties) {
  if (
    token.collection === 'GALA' &&
    token.category === 'Unit' &&
    token.type === 'none' &&
    token.additionalKey === 'none'
  ) {
    return 'GALA'
  } else {
    return `${token.collection}|${token.category}|${token.type}|${token.additionalKey}`
  }
}
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

      console.log('accounts', accounts)
      // If there is at least one account connected
      if (accounts.length > 0) {
        const connectedAddress = getAddress(accounts[0])
        return connectedAddress
      } else {
        return undefined
      }
    } catch (error) {
      console.error('Error getting connected account:', error)
      return undefined
    }
  } else {
    console.log('No Ethereum provider found')
    return undefined
  }
}

export const randomId = () => {
  return `${Math.random()}-${new Date().getTime()}`
}

export function getTokenSymbol(giveawayToken: TokenClassKeyProperties | null | undefined) {
  if (giveawayToken?.collection === 'GALA') {
    return 'GALA'
  }
  // Check if token is a Token/Unit type
  if (giveawayToken?.collection === 'Token' && giveawayToken?.category === 'Unit') {
    return giveawayToken?.type || ''
  }
  
  // Filter out properties that are "none" and join the remaining ones
  if (!giveawayToken) return ''
  
  const parts = [
    giveawayToken.collection,
    giveawayToken.category,
    giveawayToken.type,
    giveawayToken.additionalKey
  ].filter(part => part !== 'none')
  
  return parts.join('|')
}
