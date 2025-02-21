import type { BurnTokenQuantity, TokenClassKeyProperties } from '@gala-chain/api'
import type { TokenBalance } from '@gala-chain/connect'
import BigNumber from 'bignumber.js'

export enum GiveawayTokenType {
  BALANCE = 'Balance',
  ALLOWANCE = 'Allowance'
}

interface BasicGivewaySettingsBase {
  telegramAuthRequired?: boolean
  requireBurnTokenToClaim: boolean
  giveawayToken: TokenBalance
  burnTokenQuantity?: string
  burnToken: TokenClassKeyProperties
  maxWinners?: string
  giveawayTokenType?: GiveawayTokenType
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
  claimPerUser?: string
  giveawayType: 'FirstComeFirstServe'
}
export interface RandomGiveawaySettingsDto extends BasicGivewaySettingsDto {
  tokenQuantity?: string
  giveawayType: 'DistributedGiveaway'
}

export type GiveawaySettingsDto = FirstComeFirstServeGiveawaySettingsDto | RandomGiveawaySettingsDto
export function getRequiredAmount(giveaway: GiveawaySettingsDto): BigNumber | undefined {
  if (giveaway.giveawayType === 'DistributedGiveaway') {
    if (giveaway.tokenQuantity !== undefined) {
      return BigNumber(giveaway.tokenQuantity)
    } else {
      return giveaway.tokenQuantity
    }
  } else {
    return getRequiredAmountForFCFS(giveaway)
  }
}

//Helper function to get amount required for an FCFS giveaway (or undefined if something is wrong)
export function getRequiredAmountForFCFS(giveaway: GiveawaySettingsDto) {
  if (
    giveaway.giveawayType === 'FirstComeFirstServe' &&
    giveaway.maxWinners &&
    giveaway.claimPerUser
  ) {
    return BigNumber(giveaway.maxWinners).times(BigNumber(giveaway.claimPerUser))
  } else {
    throw new Error(`Unknown amout required for FCFS`)
  }
}

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
  claimableWins: ClaimableWinDto[]
}

export interface ClaimableWinDto {
  _id: string
  giveaway: string
  amountWon: number
  gcAddress: string
  giveawayToken: TokenClassKeyProperties
  burnToken: TokenClassKeyProperties
  burnTokenQuantity: number
  claimed: boolean
}

export interface GiveawayDetails {
  galaBalance: string
  giveawayWallet: string
  currentGalaFeesNeeded: string
  detailsType: 'Balance' | 'Allowance'
}

export interface GiveawayAllowances extends GiveawayDetails {
  allowances: { totalQuantity: string; unuseableQuantity: string }
  detailsType: 'Allowance'
}

export interface GiveawayBalances extends GiveawayDetails {
  tokenBalance: string
  detailsType: 'Balance'
}

export interface GasFeeEstimateRequestDto {
  giveawayType: 'FirstComeFirstServe' | 'DistributedGiveaway'
  maxWinners: number
  giveawayTokenType: GiveawayTokenType
}
