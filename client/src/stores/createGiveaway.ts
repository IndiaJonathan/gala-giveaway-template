import { ref } from 'vue'
import { defineStore } from 'pinia'
import { GiveawayTokenType, type GiveawaySettingsDto } from '@/utils/types'
import { watch } from 'vue'
import { useProfileStore } from '@/stores/profile'

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

  return {
    giveawaySettings,
    updateSettings,
    setEndDateTime
  }
})
