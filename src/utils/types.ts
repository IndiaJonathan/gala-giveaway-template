import type { TokenClassBody } from '@gala-chain/api'

export interface GiveawaySettingsDto {
  winners?: number
  tokenQuantity?: number
  endDateTime?: Date
}

export interface FullGiveawayDto {
  winners: number
  tokenQuantity: number
  endDateTime: string
  giveawayToken: TokenClassBody
}
export interface SignupForGiveawayDto {
  giveawayId: string
}

export interface Profile {
  ethAddress: string
  galaChainAddress: string
  hasTelegramLinked: boolean
  giveawayWalletAddress: string
}
