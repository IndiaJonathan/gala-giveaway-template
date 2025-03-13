import BigNumber from 'bignumber.js'

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
    return '';
  }
  if (BigNumber.isBigNumber(num)) {
    return new Intl.NumberFormat('en-US').format(Number(num.toString()))
  }
  return new Intl.NumberFormat('en-US').format(num)
}
