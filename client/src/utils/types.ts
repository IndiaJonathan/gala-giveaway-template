import type { BurnTokenQuantity } from '@gala-chain/api'
import type { TokenBalance } from '@gala-chain/connect'
import BigNumber from 'bignumber.js'

export enum GiveawayTokenType {
  BALANCE = 'Balance',
  ALLOWANCE = 'Allowance'
}

interface BasicGivewaySettingsBase {
  name?: string
  telegramAuthRequired?: boolean
  requireBurnTokenToClaim: boolean
  giveawayToken: TokenBalance
  burnTokenQuantity?: string
  burnToken: TokenClassKeyDto
  maxWinners?: string
  giveawayTokenType?: GiveawayTokenType
  winPerUser?: string
}
export interface BasicGivewaySettingsDto extends BasicGivewaySettingsBase {
  startDateTime: Date
  endDateTime?: Date
}

export interface StartBasicGivewaySettingsDto extends BasicGivewaySettingsBase {
  startDateTime: Date
  endDateTime?: String
}

export interface FirstComeFirstServeGiveawaySettingsDto extends BasicGivewaySettingsDto {
  // claimPerUser?: string
  giveawayType: 'FirstComeFirstServe'
}
export interface RandomGiveawaySettingsDto extends BasicGivewaySettingsDto {
  // tokenQuantity?: string
  giveawayType: 'DistributedGiveaway'
}

export type GiveawaySettingsDto = FirstComeFirstServeGiveawaySettingsDto | RandomGiveawaySettingsDto

export type FCFSRequiredSettingsDto = Required<FirstComeFirstServeGiveawaySettingsDto>
export type RandomRequiredGiveawaySettingsDto = Required<RandomGiveawaySettingsDto>

export interface SignupForGiveawayDto {
  giveawayId: string
  uniqueKey: string
}

export interface ClaimFCFSDto {
  giveawayId: string
  tokenInstances?: BurnTokenQuantity[]
}

export interface Profile {
  ethAddress: string
  galaChainAddress: string
  hasTelegramLinked: boolean
  giveawayWalletAddress: string
  claimableWins: ClaimableWinDtoLegacy[]
  userBalances?: {
    Hash: string
    Status: number
    Data: TokenBalance[]
  }
  giveawayWalletBalances?: {
    Hash: string
    Status: number
    Data: TokenBalance[]
  }
  availableBalances?: TokenBalance[]
}

export interface ClaimableWinDtoLegacy {
  _id: string
  giveaway: string
  amountWon: number
  gcAddress: string
  giveawayToken: TokenClassKeyDto
  burnToken: TokenClassKeyDto
  burnTokenQuantity: number
  claimed: boolean
}

export interface GiveawayDetails {
  galaBalance: string
  giveawayWallet: string
  galaNeededForOtherGiveaways: string
  detailsType: 'Balance' | 'Allowance'
}

export interface TokenBalances extends GiveawayDetails {
  tokenBalance: string
  allowances: string
  galaNeededForOtherGiveaways: string
  galaBalance: string
  availableTokens: string
}

export interface GasFeeEstimateRequestDto {
  giveawayType: 'FirstComeFirstServe' | 'DistributedGiveaway'
  maxWinners: number
  giveawayTokenType: GiveawayTokenType
}

/**
 * Represents a token class key in the system
 */
export interface TokenClassKeyDto {
  collection: string
  category: string
  type: string
  additionalKey: string
}

/**
 * Represents the filtered giveaway data returned to clients
 */
export interface FilteredGiveawayDto {
  name?: string
  endDateTime: Date
  giveawayType: 'DistributedGiveaway' | 'FirstComeFirstServe'
  giveawayToken: TokenClassKeyDto
  tokenQuantity: string
  creator: any // Using any since creator might be populated or just an ID
  burnToken?: TokenClassKeyDto
  burnTokenQuantity?: string
}

/**
 * Represents a claimable win with filtered giveaway data
 */
export interface ClaimableWinDto {
  _id: string
  giveaway: FilteredGiveawayDto
  amountWon: string
  gcAddress: string
  claimed: boolean
  claimInfo?: string
  createdAt?: Date
  updatedAt?: Date
  timeWon?: Date
  timeClaimed?: Date
}

/**
 * Response type for getUserWonGiveaways endpoint
 */
export type UserWonGiveawaysResponseDto = ClaimableWinDto[]
