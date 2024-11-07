import type { TokenClassKeyProperties } from '@gala-chain/api'

export interface GiveawaySettingsDto {
  winners?: string
  tokenQuantity?: string
  endDateTime?: Date
  telegramAuthRequired?: boolean
  requireBurnTokenToClaim: boolean
  burnTokenQuantity?: string
  burnToken: TokenClassKeyProperties
}

export interface FullGiveawayDto {
  winnerCount: string
  tokenQuantity: string
  endDateTime: string
  giveawayToken: TokenClassKeyProperties
  telegramAuthRequired: boolean
  requireBurnTokenToClaim: boolean
  burnTokenQuantity?: string
  burnToken?: TokenClassKeyProperties
}
export interface SignupForGiveawayDto {
  giveawayId: string
}

export interface Profile {
  ethAddress: string
  galaChainAddress: string
  hasTelegramLinked: boolean
  giveawayWalletAddress: string
  claimableWins: ClaimableWinDto[];
}

export interface ClaimableWinDto {
  _id: string
  giveaway: string
  amountWon: number
  gcAddress: string
  giveawayToken: TokenClassKeyProperties
  burnToken: TokenClassKeyProperties
  burnTokenQuantity: number;
  claimed: boolean;
}
