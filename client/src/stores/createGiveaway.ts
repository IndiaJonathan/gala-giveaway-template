import { computed, ref, type Ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import {
  GiveawayTokenType,
  type GiveawaySettingsDto,
  type StartBasicGivewaySettingsDto
} from '@/utils/types'
import { watch } from 'vue'
import { useProfileStore } from '@/stores/profile'
import BigNumber from 'bignumber.js'
import type { TokenClassKeyProperties } from '@gala-chain/api'
import { getRequiredGasForGiveaway } from '@/services/BackendApi'

export const useCreateGiveawayStore = defineStore('createGiveaway', () => {
  const giveawaySettings = ref<Partial<GiveawaySettingsDto>>({
    name: '',
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
    winPerUser: undefined,
    giveawayTokenType: GiveawayTokenType.BALANCE
  })

  // Gas fee properties from API
  const requiredGas = computed(() => {
    return estimateGasFee()
  })
  // Required token amount property
  const totalPoolAmount = ref(new BigNumber(0))

  function updateSettings(newSettings: Partial<GiveawaySettingsDto>) {
    giveawaySettings.value = {
      ...giveawaySettings.value,
      ...newSettings
    } as Partial<GiveawaySettingsDto>

    // Recalculate estimates when settings change
    calculateTotalPoolAmount()
  }

  const profileStore = useProfileStore()
  const { connectedUserGCAddress } = storeToRefs(profileStore)
  function setEndDateTime(newDate: Date) {
    giveawaySettings.value.endDateTime = newDate
  }

  function getPrizePool(giveaway: GiveawaySettingsDto): BigNumber | undefined {
    console.log('Calculating required amount for giveaway:', giveaway)
    if (giveaway.giveawayType === 'DistributedGiveaway') {
      if (giveaway.winPerUser !== undefined) {
        return new BigNumber(giveaway.winPerUser).multipliedBy(giveaway.maxWinners || 1)
      } else {
        return undefined
      }
    } else {
      return getPrizePoolFCFS(giveaway)
    }
  }

  //Helper function to get amount required for an FCFS giveaway (or undefined if something is wrong)
  function getPrizePoolFCFS(giveaway: GiveawaySettingsDto) {
    console.log('Calculating required amount for FCFS giveaway:', giveaway)
    if (
      giveaway.giveawayType === 'FirstComeFirstServe' &&
      giveaway.maxWinners &&
      giveaway.winPerUser
    ) {
      return new BigNumber(giveaway.maxWinners).times(new BigNumber(giveaway.winPerUser))
    } else {
      throw new Error(`Unknown amount required for FCFS`)
    }
  }

  /**
   * Calculates and updates the reactive requiredTokenAmount property
   */
  function calculateTotalPoolAmount() {
    try {
      // Cast to any to avoid type errors with partial giveaway settings
      const amount = getPrizePool(giveawaySettings.value as any)
      totalPoolAmount.value = amount || new BigNumber(0)
    } catch (error) {
      console.error('Error calculating required amount:', error)
      totalPoolAmount.value = new BigNumber(0)
    }
  }

  /**
   * Gets the required token amount based on giveaway settings
   * @returns BigNumber representing the required token amount
   */
  function getTokenPoolAmount() {
    // Ensure the amount is up to date
    calculateTotalPoolAmount()
    return totalPoolAmount.value
  }

  /**
   * Gets the total required GALA gas fee estimate
   * @returns BigNumber representing the required GALA tokens for gas
   */
  function estimateGasFee() {
    // Check if it's a fully claimed FCFS giveaway
    console.log('giveawaySettings.value.giveawayType', giveawaySettings.value.giveawayType)
    if (giveawaySettings.value.giveawayType === 'FirstComeFirstServe') {
      return new BigNumber(giveawaySettings.value.maxWinners || 0)
    } else if (giveawaySettings.value.giveawayType === 'DistributedGiveaway') {
      if (giveawaySettings.value.giveawayTokenType === GiveawayTokenType.ALLOWANCE) {
        return new BigNumber(1)
      } else {
        return new BigNumber(giveawaySettings.value.maxWinners || 0)
      }
    }
    throw new Error(`Giveaway type ${giveawaySettings.value.giveawayType} not supported`)
  }

  // Initialize estimates
  calculateTotalPoolAmount()

  // Main watcher for primary giveaway settings
  watch(
    () => [giveawaySettings.value.giveawayType, giveawaySettings.value.maxWinners],
    (newValues, oldValues) => {
      // Only run calculations if values have actually changed
      if (!oldValues || newValues[0] !== oldValues[0] || newValues[1] !== oldValues[1]) {
        console.log('Primary values changed, updating calculations')
        calculateTotalPoolAmount()
      }
    }
  )

  // Watch for FirstComeFirstServe specific property
  watch(
    () =>
      giveawaySettings.value.giveawayType === 'FirstComeFirstServe'
        ? giveawaySettings.value.winPerUser
        : undefined,
    (newValue, oldValue) => {
      if (newValue !== oldValue && giveawaySettings.value.giveawayType === 'FirstComeFirstServe') {
        console.log('FCFS claim per user changed, updating pool amount')
        calculateTotalPoolAmount()
      }
    }
  )

  // Watch for DistributedGiveaway specific property
  watch(
    () =>
      giveawaySettings.value.giveawayType === 'DistributedGiveaway'
        ? giveawaySettings.value.winPerUser
        : undefined,
    (newValue, oldValue) => {
      if (newValue !== oldValue && giveawaySettings.value.giveawayType === 'DistributedGiveaway') {
        console.log('Distributed token quantity changed, updating pool amount')
        calculateTotalPoolAmount()
      }
    }
  )

  function $reset() {
    giveawaySettings.value = {
      name: '',
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
    }
    totalPoolAmount.value = new BigNumber(0)
    calculateTotalPoolAmount()
  }

  return {
    giveawaySettings,
    updateSettings,
    setEndDateTime,
    getRequiredTokenAmount: getTokenPoolAmount,
    getPrizePool,
    getPrizePoolFCFS,
    requiredGas,
    requiredTokenAmount: totalPoolAmount,
    $reset
  }
})
