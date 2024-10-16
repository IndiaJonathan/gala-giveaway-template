import type { TokenAllowance } from "@gala-chain/api"

export function getGalaChainAddress(ethAddress: string) {
    return ethAddress.replace('0x', 'eth|')
}

export function getTokenKey(allowance: TokenAllowance) {
    return `${allowance.collection}|${allowance.category}|${allowance.type}|${allowance.additionalKey}`
}

export function getTokenKeyFromString(delimitedString: string) {
    const delimited = delimitedString.split('|')
    if (delimited.length != 4) return undefined;
    return {
        collection: delimited[0],
        category: delimited[1],
        type: delimited[2],
        additionalKey: delimited[3]
    }
}