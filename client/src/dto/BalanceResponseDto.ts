import { TokenBalance } from '@gala-chain/connect'

export interface BalanceResponseDto {
  availableBalances: TokenBalance[]
  giveawayWalletBalances: { Data: TokenBalance[] }
  userBalances: { Data: TokenBalance[] }
  requiredEscrow: {
    balanceEscrowRequirements: TokenBalance[]
    allowanceEscrowRequirements: TokenBalance[]
  }
  escrowAllowances: TokenBalance[]
}
