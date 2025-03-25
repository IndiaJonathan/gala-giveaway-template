import { ref, type Ref } from 'vue'
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

  // Gas fee properties from API
  const requiredGas = ref(new BigNumber(0))
  const escrowGas = ref(new BigNumber(0))
  const gasForGiveaway = ref(new BigNumber(0))
  // Required token amount property
  const totalPoolAmount = ref(new BigNumber(0))

  function updateSettings(newSettings: Partial<GiveawaySettingsDto>) {
    giveawaySettings.value = {
      ...giveawaySettings.value,
      ...newSettings
    } as Partial<GiveawaySettingsDto>

    // Recalculate estimates when settings change
    calculateGalaFees()
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
   * Gets gas fee estimates from the API
   */
  async function calculateGalaFees() {
    try {
      if (!profileStore.connectedUserGCAddress) {
        console.warn('GalaChain address not available. Unable to fetch gas estimates.')
        return
      }

      // Get gas estimates from the API
      const gasEstimates = await getRequiredGasForGiveaway(
        profileStore.connectedUserGCAddress,
        giveawaySettings.value as any
      )

      console.log('gasEstimates', gasEstimates)
      // Update gas fee values from API response
      requiredGas.value = new BigNumber(gasEstimates.requiredGas || 0)
      escrowGas.value = new BigNumber(gasEstimates.escrowGas || 0)
      gasForGiveaway.value = new BigNumber(gasEstimates.gasForGiveaway || 0)
    } catch (error) {
      console.error('Error fetching gas fee estimates:', error)
      // Reset values on error
      requiredGas.value = new BigNumber(0)
      escrowGas.value = new BigNumber(0)
      gasForGiveaway.value = new BigNumber(0)
    }
  }

  /**
   * Gets the required token amount based on giveaway settings
   * @returns BigNumber representing the required token amount
   */
  function getRequiredTokenAmount() {
    // Ensure the amount is up to date
    calculateTotalPoolAmount()
    return totalPoolAmount.value
  }

  /**
   * Gets the total required GALA gas fee estimate
   * @returns BigNumber representing the required GALA tokens for gas
   */
  function estimateGalaFees() {
    console.log('estimateGalaFees', requiredGas.value)
    return requiredGas.value
  }

  // Initialize estimates
  calculateTotalPoolAmount()

  // Main watcher for primary giveaway settings
  watch(
    () => [giveawaySettings.value.giveawayType, giveawaySettings.value.maxWinners],
    (newValues, oldValues) => {
      // Only run calculations if values have actually changed
      if (!oldValues || 
          newValues[0] !== oldValues[0] || 
          newValues[1] !== oldValues[1]) {
        console.log('Primary values changed, updating calculations')
        calculateGalaFees()
        calculateTotalPoolAmount()
      }
    }
  )

  // Watch for FirstComeFirstServe specific property
  watch(
    () => giveawaySettings.value.giveawayType === 'FirstComeFirstServe' ?
      giveawaySettings.value.winPerUser : undefined,
    (newValue, oldValue) => {
      if (newValue !== oldValue &&
        giveawaySettings.value.giveawayType === 'FirstComeFirstServe') {
        console.log('FCFS claim per user changed, updating pool amount')
        calculateTotalPoolAmount()
      }
    }
  )

  // Watch for DistributedGiveaway specific property
  watch(
    () => giveawaySettings.value.giveawayType === 'DistributedGiveaway' ?
           giveawaySettings.value.winPerUser : undefined,
    (newValue, oldValue) => {
      if (newValue !== oldValue && 
          giveawaySettings.value.giveawayType === 'DistributedGiveaway') {
        console.log('Distributed token quantity changed, updating pool amount')
        calculateTotalPoolAmount()
      }
    }
  )

  watch(
    () => [giveawaySettings.value.giveawayToken, connectedUserGCAddress],
    (newValues, oldValues) => {
      // Only refresh if values have actually changed
      if (!oldValues || 
          JSON.stringify(newValues[0]) !== JSON.stringify(oldValues[0]) || 
          newValues[1] !== oldValues[1]) {
        if (
          giveawaySettings.value.giveawayToken &&
          connectedUserGCAddress &&
          connectedUserGCAddress.value
        ) {
          profileStore.refreshGiveawayTokenBalances(giveawaySettings.value.giveawayToken)
        }
      }
    }
  )

  return {
    giveawaySettings,
    updateSettings,
    setEndDateTime,
    estimateGalaFees,
    getRequiredTokenAmount,
    getPrizePool,
    getPrizePoolFCFS,
    requiredGas,
    escrowGas,
    gasForGiveaway,
    requiredTokenAmount: totalPoolAmount
  }
})
