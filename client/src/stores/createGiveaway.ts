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

  // Add reactive galaFeeEstimate property
  const galaFeeEstimate = ref<BigNumber>(new BigNumber(0))  
  // Add reactive requiredTokenAmount property
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

  function setEndDateTime(newDate: Date) {
    giveawaySettings.value.endDateTime = newDate
  }


  function getPrizePool(giveaway: GiveawaySettingsDto): BigNumber | undefined {
    console.log('Calculating required amount for giveaway:', giveaway)
    if (giveaway.giveawayType === 'DistributedGiveaway') {
      if (giveaway.tokenQuantity !== undefined) {
        return BigNumber(giveaway.tokenQuantity).multipliedBy(giveaway.maxWinners || 1)
      } else {
        return giveaway.tokenQuantity
      }
    } else {
      return getPrizePoolFCFS(giveaway)
    }
  }
  
  //Helper function to get amount required for an FCFS giveaway (or undefined if something is wrong)
  function getPrizePoolFCFS(giveaway: GiveawaySettingsDto) {
    if (
      giveaway.giveawayType === 'FirstComeFirstServe' &&
      giveaway.maxWinners &&
      giveaway.claimPerUser
    ) {
      return BigNumber(giveaway.maxWinners).times(BigNumber(giveaway.claimPerUser))
    } else {
      throw new Error(`Unknown amout required for FCFS`)
    }
  }

  /**
   * Calculates and updates the reactive requiredTokenAmount property
   */
  function calculateTotalPoolAmount() {
    try {
      // Cast to any to avoid type errors with partial giveaway settings
      const amount = getPrizePool(giveawaySettings.value as any);
      totalPoolAmount.value = amount || new BigNumber(0);
    } catch (error) {
      console.error('Error calculating required amount:', error);
      totalPoolAmount.value = new BigNumber(0);
    }
  }

  /**
   * Calculates and updates the reactive galaFeeEstimate property
   */
  function calculateGalaFees() {
    if (giveawaySettings.value.giveawayType === 'DistributedGiveaway') {
      const maxWinners = giveawaySettings.value.maxWinners || '1';
      galaFeeEstimate.value = new BigNumber(maxWinners).dividedBy(1000).integerValue(BigNumber.ROUND_CEIL);
    } else if (giveawaySettings.value.giveawayType === 'FirstComeFirstServe') {
      const maxWinners = giveawaySettings.value.maxWinners || '1';
      galaFeeEstimate.value = new BigNumber(maxWinners);
    } else {
      galaFeeEstimate.value = new BigNumber(0);
    }
  }

  /**
   * Gets the required token amount based on giveaway settings
   * @returns BigNumber representing the required token amount
   */
  function getRequiredTokenAmount(): BigNumber {
    // Ensure the amount is up to date
    calculateTotalPoolAmount();
    return totalPoolAmount.value as BigNumber;
  }

  /**
   * Estimates the amount of GALA tokens needed for gas fees based on giveaway type
   * @returns BigNumber representing the required GALA tokens for gas
   */
  function estimateGalaFees(): BigNumber {
    // Ensure the estimate is up to date
    calculateGalaFees();
    return galaFeeEstimate.value as BigNumber;
  }

  // Initialize estimates
  calculateGalaFees()
  calculateTotalPoolAmount()

  watch(() => [
    giveawaySettings.value.giveawayType,
    giveawaySettings.value.maxWinners
  ], () => {
    console.log("hit here, updating")
    calculateGalaFees()
    calculateTotalPoolAmount()
    console.log(`hit here, updated: ${totalPoolAmount.value}`)
  })

  // Watch for FirstComeFirstServe specific property
  watch(() => giveawaySettings.value.giveawayType === 'FirstComeFirstServe' && 
         giveawaySettings.value.claimPerUser, () => {
    if (giveawaySettings.value.giveawayType === 'FirstComeFirstServe') {
      calculateTotalPoolAmount()
    }
  })

  // Watch for DistributedGiveaway specific property
  watch(() => giveawaySettings.value.giveawayType === 'DistributedGiveaway' && 
         giveawaySettings.value.tokenQuantity, () => {
    if (giveawaySettings.value.giveawayType === 'DistributedGiveaway') {
      calculateTotalPoolAmount()
    }
  })

  watch(() => giveawaySettings.value.giveawayToken, () => {
    calculateTotalPoolAmount()
  }, { deep: true })

  return {
    giveawaySettings,
    updateSettings,
    setEndDateTime,
    estimateGalaFees,
    getRequiredTokenAmount,
    galaFeeEstimate,
    requiredTokenAmount: totalPoolAmount 
  }
})
