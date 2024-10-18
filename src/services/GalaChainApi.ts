import { BrowserConnectClient, TokenApi } from "@gala-chain/connect";
import { createHeadlessWallet, getPublicKey } from "./GalaSwapApi";
import { FetchTokenClassesDto, createValidDTO, TokenClassKey, GalaChainResponse, type TokenClassBody, GrantAllowanceDto, AllowanceType, TokenInstanceQueryKey, type TokenClassKeyBody, FetchAllowancesDto } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

export class GalaChainApi {
    private static instance: GalaChainApi;
    private tokenClient: TokenApi | null = null;
    private tokenContractUrl = import.meta.env.VITE_TOKEN_CONTRACT_URL

    private constructor() { }

    public static getInstance(): GalaChainApi {
        if (!GalaChainApi.instance) {
            GalaChainApi.instance = new GalaChainApi();
        }
        return GalaChainApi.instance;
    }

    public async init(): Promise<void> {
        const browserClient = new BrowserConnectClient()
        this.tokenClient = new TokenApi(this.tokenContractUrl, browserClient);

        const connectionResult = await browserClient.connect();
        const publicKeyResult = await getPublicKey(connectionResult);

        if (!publicKeyResult) {
            const publicKey = await browserClient.getPublicKey();
            const signUp = await createHeadlessWallet(publicKey.publicKey)
            if (signUp) {
                console.log("New headless wallet created:", signUp);
            }
        }
    }

    public async fetchTokenClasses(tokenClass: any) {
        if (!this.tokenClient) {
            throw new Error("TokenService is not initialized. Call 'init()' first.");
        }



        const tokenClassDto = await createValidDTO<TokenClassKey>(TokenClassKey, {
            ...tokenClass
        });

        const fetchDto = await createValidDTO<FetchTokenClassesDto>(FetchTokenClassesDto, {
            tokenClasses: [tokenClassDto]
        });

        const tokenClassResponse = await this.tokenClient.FetchTokenClasses(fetchDto)


        return { tokenClassResponse, tokenClassDto };
    }

    public async getAllowances(adminGCAddress: string, tokenClassKey: TokenClassKeyBody) {
        if (!this.tokenClient) {
            throw new Error("TokenService is not initialized. Call 'init()' first.");
        }
        const fetchBalanceDto = await createValidDTO<FetchAllowancesDto>(FetchAllowancesDto, {
            grantedTo: adminGCAddress,
            ...tokenClassKey
        })
        const response = await this.tokenClient.FetchAllowances(fetchBalanceDto)
        return response;
    }

    public async grantAllowance(tokenClassDto: TokenClassKeyBody, quantity: number, adminWalletGC: string) {
        if (!this.tokenClient) {
            throw new Error("TokenService is not initialized. Call 'init()' first.");
        }

        // if (!quantity.value) {
        //     showToast(`Quantity not defined`, true)
        //     return
        // }

        const tokenInstanceQuery = await createValidDTO<TokenInstanceQueryKey>(TokenInstanceQueryKey, {
            ...tokenClassDto,
            instance: BigNumber(0)
        })

        const allowanceDto = await createValidDTO<GrantAllowanceDto>(GrantAllowanceDto, {
            tokenInstance: tokenInstanceQuery,
            quantities: [{ quantity: new BigNumber(quantity), user: adminWalletGC }],
            allowanceType: AllowanceType.Mint,
            uses: new BigNumber(quantity)
        })
        const allowanceGrant = await this.tokenClient.GrantAllowance(allowanceDto)

        return allowanceGrant;
    }
}