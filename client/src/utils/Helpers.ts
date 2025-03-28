import type { TokenBalance } from '@gala-chain/connect'
import BigNumber from 'bignumber.js'
import { tokenToReadable } from './GalaHelper'
import type { TokenClassKeyProperties } from '@gala-chain/api'

export const getEndDateMessage = (dateString?: string): string => {
  if (dateString) {
    const endDate = new Date(dateString)
    const now = new Date()

    if (now > endDate) {
      return `Ended: ${endDate.toLocaleDateString()}`
    } else {
      return `Ends: ${endDate.toLocaleString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })}`
    }
  }
  return 'No end date'
}

export function isErrorWithMessage(error: unknown): error is { Message: string } {
  return typeof error === 'object' && error !== null && 'Message' in error
}

export function formatNumber(num: number | BigNumber | undefined): string {
  if (num === undefined) {
    return ''
  }
  if (BigNumber.isBigNumber(num)) {
    return new Intl.NumberFormat('en-US').format(Number(num.toString()))
  }
  return new Intl.NumberFormat('en-US').format(num)
}

export function findTokenInArray(
  array?: TokenBalance[],
  token?: TokenBalance | TokenClassKeyProperties
): TokenBalance | undefined {
  if (!array || !token) return undefined
  if (Array.isArray(array)) {
    return array.find((t) => tokenToReadable(t) === tokenToReadable(token))
  } else {
    throw new Error('Parameter "array" is not an array')
  }
}
