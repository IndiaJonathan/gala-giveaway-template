//Useful utility script for minting a token

import { SigningClient, TokenApi } from '@gala-chain/connect'

import * as dotenv from 'dotenv'
import assert from 'assert'
import BigNumber from 'bignumber.js'
import { AllowanceType } from '@gala-chain/api'
import { Wallet } from 'ethers'

const amount = 100000;

// Load environment variables from .env file
async function mintToken() {
  dotenv.config()
  const privateKey = process.env.PRIVATE_KEY
  assert(privateKey, 'Please set your private key in .env')
  const tokenContractUrl = process.env.TOKEN_CONTRACT_URL
  assert(tokenContractUrl, 'Please set your token contract url in .env')

  const serverSigner = new SigningClient(privateKey)
  const tokenApi = new TokenApi(tokenContractUrl, serverSigner)
  const wallet = new Wallet(privateKey)
  const address = wallet.address
  const gcAddress = address.replace('0x', 'eth|')
  try {
    const allowanceResult = await tokenApi.GrantAllowance({
      allowanceType: AllowanceType.Mint,
      quantities: [{ quantity: BigNumber(amount), user: gcAddress }],
      tokenInstance: {
        additionalKey: 'none',
        category: 'Unit',
        collection: 'GALA',
        type: 'none',
        instance: new BigNumber(0)
      },
      uses: new BigNumber(amount)
    })
    console.log(allowanceResult)

    const mintResult = await tokenApi.MintToken({
      quantity: new BigNumber(amount),
      tokenClass: {
        additionalKey: 'none',
        category: 'Unit',
        collection: 'GALA',
        type: 'none'
      }
    })
    console.log(mintResult)
  } catch (e) {
    console.error(e)
  }
}

mintToken()
