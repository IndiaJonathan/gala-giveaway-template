//Useful utility script for minting a token

import { PresignedClient, TokenApi } from '@gala-chain/connect'

import * as dotenv from 'dotenv'
import assert from 'assert'

// Load environment variables from .env file
async function getBalances() {
  dotenv.config()
  const walletKey = process.env.BALANCE_WALLET
  assert(walletKey, 'Please set your private key in .env')
  const tokenContractUrl = process.env.TOKEN_CONTRACT_URL
  assert(tokenContractUrl, 'Please set your token contract url in .env')

  const serverSigner = new PresignedClient()
  const tokenApi = new TokenApi(tokenContractUrl, serverSigner)
  try {
    const balanceResult = await tokenApi.FetchBalances({
      owner: walletKey
    })
    console.log(balanceResult)

  } catch (e) {
    console.error(e)
  }
}

getBalances()
