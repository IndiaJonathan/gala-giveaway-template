<template>
  <v-container class="giveaway-settings">
    <v-card elevation="4">
      <v-card-title class="headline">Giveaway Settings</v-card-title>
      <v-card-text>
        <v-form ref="form">
          <!-- Number of Winners -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="giveawaySettings.winners"
                :rules="winnersRules"
                label="Number of Winners"
                type="number"
                min="1"
                outlined
                dense
                :readonly="props.readOnly"
                :disabled="props.readOnly"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Quantity of Tokens -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="giveawaySettings.tokenQuantity"
                :rules="tokenQuantityRules"
                label="Quantity of Tokens"
                type="number"
                min="1"
                outlined
                dense
                :readonly="props.readOnly"
                :disabled="props.readOnly"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Token Class Fields -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                disabled
                v-model="tokenClass.type"
                label="Token Type"
                outlined
                dense
                :readonly="props.readOnly"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                disabled
                v-model="tokenClass.collection"
                label="Collection"
                outlined
                dense
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                disabled
                v-model="tokenClass.category"
                label="Category"
                outlined
                dense
                :readonly="props.readOnly"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                disabled
                v-model="tokenClass.additionalKey"
                label="Additional Key"
                outlined
                dense
                :readonly="props.readOnly"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- End Date and Time -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-menu
                v-model="dateMenu"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="290px"
                :readonly="props.readOnly"
              >
                <template #activator="{ props }">
                  <v-text-field
                    label="End Date"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    outlined
                    dense
                    v-model="formattedDate"
                    :rules="dateRules"
                    :disabled="props.readOnly"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="props.giveawaySettings.endDateTime"
                  @update:modelValue="dateMenu = false"
                  :disabled="props.readOnly"
                ></v-date-picker>
              </v-menu>
            </v-col>

            <!-- Time Picker -->
            <v-col cols="11" sm="5">
              <v-text-field
                v-model="formattedTime"
                :active="timeMenu"
                :focused="timeMenu"
                label="End Time"
                prepend-icon="mdi-clock-time-four-outline"
                readonly
                :rules="timeRules"
              >
                <v-dialog v-model="timeMenu" activator="parent" width="auto">
                  <v-time-picker
                    format="24hr"
                    v-if="timeMenu"
                    v-model="selectedTime"
                    :readonly="props.readOnly"
                  ></v-time-picker>
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
import type { GiveawaySettingsDto } from '@/utils/types'
import type { TokenClassBody } from '@gala-chain/api'
import { ref, computed, defineProps, watch, type PropType } from 'vue'

const props = defineProps({
  tokenClass: {
    type: Object as PropType<TokenClassBody>,
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
const isFormValid = ref<boolean>(false)

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
  (v: number) => v >= 1 || 'Must be at least 1'
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
  () => {
    if (!props.giveawaySettings.endDateTime) return true
    return (
      props.giveawaySettings.endDateTime > new Date() || 'End date and time must be in the future'
    )
  }
]

const timeRules = [
  () => !!props.giveawaySettings.endDateTime || 'End time is required',
  () => {
    if (!props.giveawaySettings.endDateTime) return true
    return (
      props.giveawaySettings.endDateTime > new Date() || 'End date and time must be in the future'
    )
  }
]

// Computed endDateTime
// const endDateTime = computed(() => {
//   if (date.value && time.value) {
//     const [hours, minutes] = time.value.split(':').map(Number)
//     const endDateTime = new Date(date.value)
//     endDateTime.setHours(hours, minutes, 0, 0)
//     return endDateTime
//   }
//   return null
// })
watch([props.giveawaySettings], async () => {
  if (
    props.giveawaySettings.endDateTime &&
    props.giveawaySettings.tokenQuantity &&
    props.giveawaySettings.winners
  ) {
    const validation = await form.value.validate()
    emit('form-valid', validation.valid)
  } else {
    emit('form-valid', false)
  }
  // Emit form validity to parent
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

// function submitForm() {
//   if (form.value.validate()) {
//     // Additional validation for endDateTime
//     if (!endDateTime.value || endDateTime.value <= new Date()) {
//       // Show error message
//       alert('End date and time must be in the future')
//       return
//     }

//     // Handle form submission, e.g., API calls
//     console.log({
//       winners: winners.value,
//       tokenQuantity: tokenQuantity.value,
//       tokenClass: props.tokenClass,
//       endDateTime: endDateTime.value
//     })
//   }
// }

// watch([winners, tokenQuantity, date, time], async () => {
//   console.log('hit')
//   const validation = await form.value.validate()
//   // Emit form validity to parent
//   emit('form-valid', validation.valid)
// })
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

.v-btn {
  border-radius: 25px;
}
</style>
