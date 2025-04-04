import type { TokenClassKeyProperties } from '@gala-chain/api'

export interface Giveaway {
  _id: string
  giveawayToken: TokenClassKeyProperties & { image: string }
  maxWinners: string
  signature: string
  startDateTime: string
  endDateTime?: string
  usersSignedUp: string[]
  telegramAuthRequired: boolean
  requireBurnTokenToClaim: boolean
  burnTokenQuantity?: string
  burnToken: TokenClassKeyProperties & { image: string }
  isWinner?: boolean
  winPerUser?: string
  claimsLeft?: number
  giveawayType: 'FirstComeFirstServe' | 'DistributedGiveaway'
  name?: string
}
