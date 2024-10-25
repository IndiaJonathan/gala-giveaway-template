import type { TokenClassBody } from '@gala-chain/api'

export interface GiveawaySettingsDto {
  winners?: number
  tokenQuantity?: number
  endDateTime?: Date
  telegramAuthRequired?: boolean
}

export interface FullGiveawayDto {
  winnerCount: number
  tokenQuantity: number
  endDateTime: string
  giveawayToken: TokenClassBody
  telegramAuthRequired: boolean
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
