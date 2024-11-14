<template>
  <v-container class="giveaway-settings">
    <v-card elevation="4">
      <v-card-title class="headline">Giveaway Settings</v-card-title>
      <v-card-text>
        <v-form ref="form">
          <!-- Number of Winners -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="giveawaySettings.winners" :rules="winnersRules" label="Number of Winners"
                type="number" min="1" :max="MAX_WINNERS" outlined dense :readonly="props.readOnly"
                :disabled="props.readOnly" class="flex-grow-1"></v-text-field>

              <!-- Tooltip with information icon next to the input field -->

            </v-col>
            <v-col>
              <v-tooltip>
                <template #activator="{ props }">
                  <v-icon small v-bind="props" class="ml-2">mdi-information-outline</v-icon>
                </template>
                <span>
                  A winner may win multiple times, as winners are selected with replacement.
                </span>
              </v-tooltip>
            </v-col>
          </v-row>

          <!-- Quantity of Tokens -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="giveawaySettings.tokenQuantity" :rules="tokenQuantityRules"
                label="Quantity of Tokens" type="number" min="1" outlined dense :readonly="props.readOnly"
                :disabled="props.readOnly"></v-text-field>
            </v-col>
          </v-row>


          <v-row>
            <v-col cols="12">
              <v-card class="pa-3" outlined>
                <v-card-title class="subheading">Giveaway Token</v-card-title>
                <v-card-text></v-card-text>
                <TokenInput v-bind:tokenClass="tokenClass" :read-only="true" :disabled="true" />
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" sm="6">
              <v-checkbox v-model="giveawaySettings.telegramAuthRequired" label="Telegram Auth Required"
                :readonly="props.readOnly" :disabled="props.readOnly"></v-checkbox>
            </v-col>
          </v-row>

          <!-- Require Burn Token to Claim -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-checkbox v-model="giveawaySettings.requireBurnTokenToClaim" label="Require burn token to claim?"
                :readonly="props.readOnly" :disabled="props.readOnly">
                <!-- Tooltip with explanation -->
                <template #label>
                  Require burn token to claim?
                  <v-tooltip location="bottom">
                    <template #activator="{ props }">
                      <v-icon small v-bind="props" class="ml-1">mdi-information-outline</v-icon>
                    </template>
                    <span>
                      If selected, the user must burn the token you specify to claim any winnings.
                    </span>
                  </v-tooltip>
                </template>
              </v-checkbox>
            </v-col>
          </v-row>

          <!-- Burn Token Fields -->
          <transition name="fade-slide">

            <v-row v-show="giveawaySettings.requireBurnTokenToClaim">
              <v-col cols="12">
                <v-card class="pa-3" outlined>
                  <v-card-title class="subheading">Burn Token Details</v-card-title>
                  <TokenInput ref="burnTokenInputRef" @update:token-class="tokenClassUpdated"
                    v-model:tokenClass="giveawaySettings.burnToken"
                    v-model:quantity="giveawaySettings.burnTokenQuantity" :showQuantity="true"
                    quantity-label="Amount Required To Burn Per Claim" :read-only="props.readOnly"
                    :disabled="props.readOnly" />
                  <v-card-actions>
                    <v-btn class="bg-success" :disabled="props.readOnly || !!selectedBurnToken" rounded block
                      @click="selectBurnToken" :readonly="props.readOnly">Set Token As Burn Requirement
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </transition>


          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field disabled v-model="tokenClass.category" label="Category" outlined dense
                :readonly="props.readOnly"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field disabled v-model="tokenClass.additionalKey" label="Additional Key" outlined dense
                :readonly="props.readOnly"></v-text-field>
            </v-col>
          </v-row>

          <!-- End Date and Time -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-menu v-model="dateMenu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition"
                offset-y min-width="290px" :readonly="props.readOnly">
                <template #activator="{ props }">
                  <v-text-field label="End Date" prepend-icon="mdi-calendar" readonly v-bind="props" outlined dense
                    v-model="formattedDate" :rules="dateRules" :disabled="props.readOnly"></v-text-field>
                </template>
                <v-date-picker v-model="props.giveawaySettings.endDateTime" @update:modelValue="dateMenu = false"
                  :disabled="props.readOnly"></v-date-picker>
              </v-menu>
            </v-col>

            <!-- Time Picker -->
            <v-col cols="11" sm="5">
              <v-text-field v-model="formattedTime" :active="timeMenu" :focused="timeMenu" label="End Time"
                prepend-icon="mdi-clock-time-four-outline" readonly :rules="timeRules">
                <v-dialog v-model="timeMenu" activator="parent" width="auto">
                  <v-time-picker format="24hr" v-if="timeMenu" v-model="selectedTime"
                    :readonly="props.readOnly"></v-time-picker>
                </v-dialog>
              </v-text-field>
            </v-col>
          </v-row>

          <!-- Giveaway Duration Display -->
          <v-row>
            <v-col cols="12">
              <v-alert type="info" v-if="giveawayDuration">{{ giveawayDuration }}</v-alert>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import type { TokenClassKey, TokenClassKeyProperties } from '@gala-chain/api';
import type { GiveawaySettingsDto } from '@/utils/types'
import { ref, computed, defineProps, watch, type PropType, type Ref, nextTick } from 'vue'
import { MAX_WINNERS } from '../utils/constants'
import TokenInput from '@/components/TokenInput.vue'
import { onMounted } from 'vue';
import { GalaChainApi } from '@/services/GalaChainApi';
import { GalaChainResponseError } from '@gala-chain/connect';
import { useToast } from '@/composables/useToast';


const { showToast } = useToast()

const props = defineProps({
  tokenClass: {
    type: Object as PropType<TokenClassKeyProperties>,
    required: true
  },
  giveawaySettings: {
    type: Object as PropType<GiveawaySettingsDto>,
    required: true
  },
  readOnly: {
    type: Boolean,
    required: false
  }
})

const dateMenu = ref<boolean>(false)
const timeMenu = ref<boolean>(false)
const burnTokenInputRef = ref();
let selectedBurnToken: Ref<TokenClassKey | null> = ref(null)
const tokenService = GalaChainApi.getInstance()


function tokenClassUpdated() {
  console.log('token class updated')
  selectedBurnToken.value = null;
}
async function selectBurnToken() {
  await tokenService.init()

  const isValid = await burnTokenInputRef.value.validate()
  if (isValid.valid) {
    try {
      const { tokenClassDto, tokenClassResponse } = await tokenService.fetchTokenClasses(props.giveawaySettings.burnToken)
      if (
        tokenClassResponse.Status === 1 &&
        tokenClassResponse.Data &&
        tokenClassResponse.Data[0]
      ) {
        selectedBurnToken.value = tokenClassDto
      }
    } catch (e: any) {
      // selectedBurnToken.value = null
      if (e instanceof GalaChainResponseError) {
        showToast(e.Message || 'Unable to get token class', true)
      } else {
        showToast(e.message || 'Unable to get token class', true)

      }
    } finally {
      await checkValidation()
    }

  }
}

const selectedTime = ref(
  props.giveawaySettings.endDateTime
    ? new Date(props.giveawaySettings.endDateTime).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
)

watch(selectedTime, (newTimeString) => {
  if (typeof newTimeString === 'string') {
    // Parse the string "HH:mm" into hours and minutes
    const [hours, minutes] = newTimeString.split(':').map(Number)

    // Get the current endDateTime or create a new Date
    const currentDateTime = props.giveawaySettings.endDateTime
      ? new Date(props.giveawaySettings.endDateTime)
      : new Date()

    // Update only the hours and minutes of endDateTime
    currentDateTime.setHours(hours)
    currentDateTime.setMinutes(minutes)

    // Update the endDateTime in the props (use Vue reactivity)
    props.giveawaySettings.endDateTime = currentDateTime
  }
})

const emit = defineEmits<{
  (e: 'form-valid', formIsValid: boolean): void
}>()
const form = ref()

// Formatted date and time for display in text fields
const formattedDate = computed({
  get: () => {
    return props.giveawaySettings.endDateTime
      ? props.giveawaySettings.endDateTime.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      : ''
  },
  set: (val) => {
    // No action needed since date is set via date picker
  }
})

const formattedTime = computed({
  get: () => {
    return props.giveawaySettings.endDateTime
      ? props.giveawaySettings.endDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Ensures 24-hour format
      })
      : ''
  },
  set: (val) => {
    // No action needed since date is set via date picker
  }
})

// Validation rules
const winnersRules = [
  (v: number) => !!v || 'Number of winners is required',
  (v: number) => v >= 1 || 'Must be at least 1',
  (v: number) => v <= MAX_WINNERS || `May not exceed ${MAX_WINNERS}`
]

const tokenQuantityRules = [
  (v: number) => !!v || 'Token quantity is required',
  (v: number) => v >= 1 || 'Must be at least 1',
  (v: number) =>
    Number(v) >= Number(props.giveawaySettings.winners) ||
    'Quantity must be greater than or equal to the number of winners'
]

const dateRules = [
  () => !!props.giveawaySettings.endDateTime || 'End date is required',
]

const timeRules = [
  () => !!props.giveawaySettings.endDateTime || 'End time is required',
  () => {
    if (!props.giveawaySettings.endDateTime) return true
    return (
      props.giveawaySettings.endDateTime > new Date() || 'End time must be in the future'
    )
  }
]

async function checkValidation() {
  if (
    props.giveawaySettings.endDateTime &&
    props.giveawaySettings.tokenQuantity &&
    props.giveawaySettings.winners
  ) {
    let valid = true;
    if (props.giveawaySettings.requireBurnTokenToClaim) {
      const burnTokenInputRefValid = await burnTokenInputRef.value.validate();
      valid = burnTokenInputRefValid.valid
      valid = !!(selectedBurnToken.value) && valid

    }
    const formValid = await form.value.validate();
    valid = (formValid).valid && valid;

    emit('form-valid', valid)
  } else {
    emit('form-valid', false)
  }
}


watch([props.giveawaySettings], async () => {
  nextTick(async () => { await checkValidation() }),
    { deep: true }
})
// Giveaway duration display
const giveawayDuration = computed(() => {
  if (!props.giveawaySettings.endDateTime) return ''
  const now = new Date()
  const diff = props.giveawaySettings.endDateTime.getTime() - now.getTime()
  if (diff <= 0) return 'The giveaway end time is in the past'

  const diffInMinutes = Math.floor(diff / (1000 * 60))
  const days = Math.floor(diffInMinutes / (60 * 24))
  const hours = Math.floor((diffInMinutes % (60 * 24)) / 60)
  const minutes = diffInMinutes % 60

  let durationStr = 'Giveaway will last for '
  if (days > 0) durationStr += `${days} day(s) `
  if (hours > 0) durationStr += `${hours} hour(s) `
  if (minutes > 0) durationStr += `${minutes} minute(s)`
  return durationStr.trim()
})
</script>

<style scoped>
.giveaway-settings {
  max-width: 600px;
  margin: auto;
  padding: 20px;
}

.v-card-title {
  color: #3f51b5;
  font-weight: bold;
}

.v-card {
  border-radius: 12px;
}


.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
