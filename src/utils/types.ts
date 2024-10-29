
import type { TokenClassKeyProperties } from '@gala-chain/api';

export interface GiveawaySettingsDto {
  winners?: number
  tokenQuantity?: number
  endDateTime?: Date
  telegramAuthRequired?: boolean
  requireBurnTokenToClaim: boolean
  burnTokenQuantity?: number
  burnToken: TokenClassKeyProperties
}

export interface FullGiveawayDto {
  winnerCount: number
  tokenQuantity: number
  endDateTime: string
  giveawayToken: TokenClassKeyProperties
  telegramAuthRequired: boolean
  requireBurnTokenToClaim: boolean
  burnTokenQuantity?: number

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
