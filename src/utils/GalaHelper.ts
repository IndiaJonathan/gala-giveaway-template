export function getGalaChainAddress(ethAddress: string) {
    return ethAddress.replace('0x', 'eth|')
}