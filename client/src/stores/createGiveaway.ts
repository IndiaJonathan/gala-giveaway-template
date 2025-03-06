import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { GiveawayTokenType, type GiveawaySettingsDto } from '@/utils/types'
import { watch } from 'vue'
import { useProfileStore } from '@/stores/profile'
import BigNumber from 'bignumber.js'

export const useCreateGiveawayStore = defineStore('createGiveaway', () => {
  const giveawaySettings = ref<Partial<GiveawaySettingsDto>>({
    endDateTime: new Date(new Date().setDate(new Date().getDate() + 1)),
    telegramAuthRequired: false,
    requireBurnTokenToClaim: false,
    burnToken: {
      collection: 'GALA',
      category: 'Unit',
      type: 'none',
      additionalKey: 'none'
    },
    burnTokenQuantity: '1',
    giveawayType: 'DistributedGiveaway',
    giveawayToken: undefined,
    giveawayTokenType: GiveawayTokenType.BALANCE
  })

  function updateSettings(newSettings: Partial<GiveawaySettingsDto>) {
    giveawaySettings.value = {
      ...giveawaySettings.value,
      ...newSettings
    } as Partial<GiveawaySettingsDto>
  }

  const profileStore = useProfileStore()

  function setEndDateTime(newDate: Date) {
    giveawaySettings.value.endDateTime = newDate
  }

  /**
   * Estimates the amount of GALA tokens needed for gas fees based on giveaway type
   * @returns BigNumber representing the required GALA tokens for gas
   */
  function estimateGalaFees(): BigNumber {
    if (giveawaySettings.value.giveawayType === 'DistributedGiveaway') {
      return BigNumber(giveawaySettings.value.maxWinners || 1).dividedBy(1000).integerValue(BigNumber.ROUND_CEIL);
    } else if (giveawaySettings.value.giveawayType === 'FirstComeFirstServe') {
      return BigNumber(giveawaySettings.value.maxWinners || 1);
    } else {
      return new BigNumber(0);
    }
  }

  return {
    giveawaySettings,
    updateSettings,
    setEndDateTime,
    estimateGalaFees
  }
}) as unknown as () => {
  giveawaySettings: Ref<Partial<GiveawaySettingsDto>>
  updateSettings: (newSettings: Partial<GiveawaySettingsDto>) => void
  setEndDateTime: (newDate: Date) => void
  estimateGalaFees: () => BigNumber
}
