import { BrowserConnectClient, TokenApi } from '@gala-chain/connect'
import { createHeadlessWallet, getPublicKey } from './GalaSwapApi'
import {
  FetchTokenClassesDto,
  createValidDTO,
  TokenClassKey,
  GrantAllowanceDto,
  AllowanceType,
  TokenInstanceQueryKey,
  FetchAllowancesDto,
  type TokenClassKeyProperties,
  TransferTokenDto,
  FetchBalancesDto
} from '@gala-chain/api'
import BigNumber from 'bignumber.js'

export class GalaChainApi {
  private static instance: GalaChainApi
  private tokenClient: TokenApi | null = null
  private tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL

  private constructor() {}

  public static getInstance(): GalaChainApi {
    if (!GalaChainApi.instance) {
      GalaChainApi.instance = new GalaChainApi()
    }
    return GalaChainApi.instance
  }

  public async init(): Promise<void> {
    const browserClient = new BrowserConnectClient()
    this.tokenClient = new TokenApi(this.tokenContractUrl, browserClient)

    const connectionResult = await browserClient.connect()
    const publicKeyResult = await getPublicKey(connectionResult)

    if (!publicKeyResult) {
      const publicKey = await browserClient.getPublicKey()
      const signUp = await createHeadlessWallet(publicKey.publicKey)
      if (signUp) {
        console.log('New headless wallet created:', signUp)
      }
    }
  }

  public async fetchOwnedTokens() {
    if (!this.tokenClient) {
      throw new Error("TokenService is not initialized. Call 'init()' first.")
    }

    const balances = await this.tokenClient.FetchBalancesWithTokenMetadata({ category: 'GalaRocks' })
  }

  public async fetchTokenClasses(tokenClass: TokenClassKeyProperties) {
    if (!this.tokenClient) {
      throw new Error("TokenService is not initialized. Call 'init()' first.")
    }

    const tokenClassDto = await createValidDTO<TokenClassKey>(TokenClassKey, {
      ...tokenClass
    })

    const fetchDto = await createValidDTO<FetchTokenClassesDto>(FetchTokenClassesDto, {
      tokenClasses: [tokenClassDto]
    })

    const tokenClassResponse = await this.tokenClient.FetchTokenClasses(fetchDto)

    return { tokenClassResponse, tokenClassDto }
  }

  public async getBalances(gcAddress: string, tokenClassKey: TokenClassKeyProperties) {
    if (!this.tokenClient) {
      throw new Error("TokenService is not initialized. Call 'init()' first.")
    }
    const fetchBalanceDto = await createValidDTO<FetchBalancesDto>(FetchBalancesDto, {
      ...tokenClassKey,
      instance: '0',
      owner: gcAddress
    } as any)
    const response = await this.tokenClient.FetchBalances(fetchBalanceDto)
    return response
  }

  public async getAllowances(gcAddress: string, tokenClassKey: TokenClassKeyProperties) {
    if (!this.tokenClient) {
      throw new Error("TokenService is not initialized. Call 'init()' first.")
    }
    const fetchBalanceDto = await createValidDTO<FetchAllowancesDto>(FetchAllowancesDto, {
      grantedTo: gcAddress,
      ...tokenClassKey
    })
    const response = await this.tokenClient.FetchAllowances(fetchBalanceDto)
    return response
  }

  public async grantAllowance(
    tokenClassDto: TokenClassKeyProperties,
    quantity: BigNumber,
    adminWalletGC: string
  ) {
    if (!this.tokenClient) {
      throw new Error("TokenService is not initialized. Call 'init()' first.")
    }

    const tokenInstanceQuery = await createValidDTO<TokenInstanceQueryKey>(TokenInstanceQueryKey, {
      ...tokenClassDto,
      instance: BigNumber(0)
    })

    const allowanceDto = await createValidDTO<GrantAllowanceDto>(GrantAllowanceDto, {
      tokenInstance: tokenInstanceQuery,
      quantities: [{ quantity, user: adminWalletGC }],
      allowanceType: AllowanceType.Mint,
      uses: quantity
    })
    const allowanceGrant = await this.tokenClient.GrantAllowance(allowanceDto)

    return allowanceGrant
  }

  public async transferToken(
    token: TokenClassKeyProperties,
    quantity: string,
    adminWalletGC: string
  ) {
    if (!this.tokenClient) {
      throw new Error("TokenService is not initialized. Call 'init()' first.")
    }

    const tokenInstanceQuery = await createValidDTO<TokenInstanceQueryKey>(TokenInstanceQueryKey, {
      ...token,
      instance: BigNumber(0)
    })

    const transferBalance = await this.tokenClient.TransferToken({
      tokenInstance: tokenInstanceQuery as any,
      quantity: quantity as any as BigNumber,
      to: adminWalletGC
    })

    return transferBalance
  }
}
