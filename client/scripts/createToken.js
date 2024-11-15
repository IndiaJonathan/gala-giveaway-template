//Useful utility script for creating a token, and making yourself the authority

import { SigningClient, TokenApi } from '@gala-chain/connect'

import * as dotenv from 'dotenv'
import assert from 'assert'
import BigNumber from 'bignumber.js'
import { AllowanceType } from '@gala-chain/api'
import { Wallet } from 'ethers'

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
    const createResult = await tokenApi.CreateTokenClass({
      description: 'TEST',
      image: 'foo.png',
      name: 'TEST',
      symbol: 'TEST',
      tokenClass: {
        additionalKey: 'none',
        category: 'TEST',
        collection: 'Unit',
        type: 'none'
      },
      authorities: [gcAddress],
      maxSupply: Number.MAX_SAFE_INTEGER.toString()
    })
    console.log(createResult)
    const allowanceResult = await tokenApi.GrantAllowance({
      tokenInstance: {
        additionalKey: 'none',
        category: 'TEST',
        collection: 'Unit',
        type: 'none',
        instance: '0'
      },
      uses: BigNumber(1),
      allowanceType: AllowanceType.Mint,
      quantities: [{ quantity: BigNumber(1), user: 'userHere' }]
    })
    console.log(allowanceResult)
  } catch (e) {
    console.error(e)
  }
}

mintToken()