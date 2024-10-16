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
                v-model="winners"
                label="Number of Winners"
                type="number"
                min="1"
                outlined
                dense
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Quantity of Tokens -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="tokenQuantity"
                label="Quantity of Tokens"
                type="number"
                min="1"
                outlined
                dense
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Token Class Fields -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="tokenClass.type"
                label="Token Type"
                outlined
                dense
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
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
                v-model="tokenClass.category"
                label="Category"
                outlined
                dense
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="tokenClass.additionalKey"
                label="Additional Key"
                outlined
                dense
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- End Date and Time -->
          <v-row>
            <v-col cols="12" sm="6">
              <v-menu
                v-model="menu"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="290px"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="endDate"
                    label="End Date"
                    prepend-icon="mdi-calendar"
                    readonly
                    v-bind="props"
                    outlined
                    dense
                  ></v-text-field>
                </template>
                <v-date-picker v-model="date" @input="updateEndDate"></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="6">
              <v-menu
                v-model="timeMenu"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="290px"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="endTime"
                    label="End Time"
                    prepend-icon="mdi-clock-outline"
                    readonly
                    v-bind="props"
                    outlined
                    dense
                  ></v-text-field>
                </template>
                <v-time-picker v-model="time" @input="updateEndTime"></v-time-picker>
              </v-menu>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="submitForm">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, defineProps } from 'vue'

interface TokenClass {
  type: string
  collection: string
  category: string
  additionalKey: string
}

const props = defineProps<{
  tokenClass: TokenClass
}>()

const winners = ref<number>(1)
const tokenQuantity = ref<number>(0)
const date = ref<string | null>(null)
const time = ref<string | null>(null)
const menu = ref<boolean>(false)
const timeMenu = ref<boolean>(false)

const endDate = ref<string>('')
const endTime = ref<string>('')

const tokenClass = ref<TokenClass>({ ...props.tokenClass })

function updateEndDate(selectedDate: string) {
  date.value = selectedDate
  endDate.value = selectedDate
  menu.value = false
}

function updateEndTime(selectedTime: string) {
  time.value = selectedTime
  endTime.value = selectedTime
  timeMenu.value = false
}

function submitForm() {
  // Handle form submission, e.g., validation, API calls, etc.
  console.log({
    winners: winners.value,
    tokenQuantity: tokenQuantity.value,
    tokenClass: tokenClass.value,
    endDateTime: `${endDate.value} ${endTime.value}`
  })
}
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
