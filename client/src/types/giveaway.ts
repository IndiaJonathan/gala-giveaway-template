import type { TokenClassKeyProperties } from '@gala-chain/api'

export interface Giveaway {
  _id: string
  giveawayToken: TokenClassKeyProperties
  tokenQuantity: string
  maxWinners: string
  signature: string
  image: string
  startDateTime: string
  endDateTime?: string
  usersSignedUp: string[]
  telegramAuthRequired: boolean
  requireBurnTokenToClaim: boolean
  burnTokenQuantity?: string
  burnToken: TokenClassKeyProperties
  isWinner?: boolean
  claimPerUser?: string
  claimsLeft?: number
  giveawayType: 'FirstComeFirstServe' | 'DistributedGiveway'
}
