import type { TokenClassKeyBody } from "@gala-chain/api"

export interface GiveawaySettingsDto {
    winners: number
    tokenQuantity: number
    tokenClass: TokenClassKeyBody
    endDateTime: Date
}