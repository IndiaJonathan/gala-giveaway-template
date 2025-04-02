<template>
    <Collapsible title="Schedule Giveaway" :collapsible="true" :isOpen="isOpen">

        <p style="margin-bottom: 32px;" class="explanatory-text" v-if="giveawaySettings.giveawayType === 'FirstComeFirstServe'">
            Set the timing for your giveaway. You can choose to run it indefinitely or specify a start and end date.
            Select dates from the calendar and set precise times below.
        </p>

        <p style="margin-bottom: 32px;" class="explanatory-text" v-else>
            Set the timing for your raffle giveaway. Specify both a start and end date to determine when users can enter.
            Select dates from the calendar and set precise times below.
        </p>

        <ToggleSwitch v-if="giveawaySettings.giveawayType === 'FirstComeFirstServe'" v-model:selected="selected"
            @update:selected="clearDate" style="margin-bottom: 32px; width: 100%;" :options="options">
        </ToggleSwitch>


        <v-row class="giveaway-dates mb-8">
            <v-col style="width: 50%;">
                <div class="date-box">
                    <p class="subtitle">GIVEAWAY START DATE</p>
                    <p class="paragraph-small-regular">{{ formattedStartDate }}</p>
                    <p v-if="startDateError" class="error-text">{{ startDateError }}</p>
                </div>
            </v-col>
            <v-col style="width: 50%;" v-if="selected === options[1].key">
                <div class="date-box">
                    <p class="subtitle">GIVEAWAY END DATE</p>
                    <p class="paragraph-small-regular">{{ formattedEndDate }}</p>
                    <p v-if="endDateError" class="error-text">{{ endDateError }}</p>
                </div>
            </v-col>
        </v-row>

        <VueDatePicker v-model="selectedDates" :range="!(selected === options[0].key)" inline auto-apply
            :enable-time-picker="false" :min-date="today" :ui="{ calendar: 'testclass', menu: 'testclass' }"
            class="custom-date-picker paragraph-medium-bold">

            <template #arrow-left>
                <button class="nav-chip">
                    <img src="@/assets/chevron-left.png" alt="Chevron Icon" class="icon" />
                </button> </template>

            <!-- Custom Next Button -->
            <template #arrow-right>
                <button class="nav-chip rotate">
                    <img src="@/assets/chevron-left.png" alt="Chevron Icon" class="icon" />
                </button> </template>
        </VueDatePicker>

        <TimeInput title="Start Time" v-model="startTime"></TimeInput>
        <p v-if="startTimeError" class="error-text time-error">{{ startTimeError }}</p>

        <TimeInput v-if="selected === options[1].key" title="End Time" v-model="endTime"></TimeInput>
        <p v-if="endTimeError && selected === options[1].key" class="error-text time-error">{{ endTimeError }}</p>

    </Collapsible>
</template>

<script lang="ts" setup>
import { computed, ref, watch, type Ref } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import ToggleSwitch from './ToggleSwitch.vue';
import Collapsible from './Collapsible.vue'
import { useCreateGiveawayStore } from '@/stores/createGiveaway';
import { storeToRefs } from 'pinia';
import TimeInput from './TimeInput.vue';

const selectedDates = ref<Date[]>();

const now = new Date();

// Use current time instead of 30 minutes ahead
const futureDate = new Date(now.getTime());

const startTime = ref(futureDate);
const endTime = ref(futureDate);
const props = defineProps({
    isOpen: { type: Boolean, default: true },
});



const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings } = storeToRefs(giveawayStore)

// Get tomorrow's date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);

// Today's date (for min-date)
const today = new Date();
today.setHours(0, 0, 0, 0);

const options: [
    { key: string; label: string },
    { key: string; label: string }
] = [{ key: "No end date", label: "No end date" }, { key: "Set end date", label: "Set end date" }]
const selected: Ref = ref(options[1].key);




const clearDate = () => {
    selectedDates.value = undefined;
    if (selected.value === options[0].key) {
        giveawayStore.updateSettings({ endDateTime: undefined });
    }
}


function formatDate(date: Date): string {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}


const combinedStartDate = computed(() => {
    if (!selectedDates.value) return null;
    // Get the selected day (if an array, take the first date)
    const selectedDay = Array.isArray(selectedDates.value)
        ? selectedDates.value[0]
        : selectedDates.value;
    const start = startTime.value;
    return new Date(
        selectedDay.getFullYear(),
        selectedDay.getMonth(),
        selectedDay.getDate(),
        start.getHours(),
        start.getMinutes(),
        start.getSeconds(),
        start.getMilliseconds()
    );
});

const combinedEndDate = computed(() => {
    if (!selectedDates.value) return null;
    // Get the selected day (if an array, take the first date)
    const selectedDay = Array.isArray(selectedDates.value)
        ? selectedDates.value[1]
        : undefined;
    const end = endTime.value;
    if (selectedDay) {
        return new Date(
            selectedDay.getFullYear(),
            selectedDay.getMonth(),
            selectedDay.getDate(),
            end.getHours(),
            end.getMinutes(),
            end.getSeconds(),
            end.getMilliseconds()
        );
    } else {
        return undefined;
    }

});


watch(combinedStartDate, (newStartDate) => {
  if (newStartDate) {
    giveawayStore.updateSettings({ startDateTime: newStartDate });
  }
});

watch(combinedEndDate, (newEndDate) => {
  giveawayStore.updateSettings({ endDateTime: newEndDate || undefined });
});


const formattedStartDate = computed(() => {
    return combinedStartDate.value ? formatDate(combinedStartDate.value) : "Select a date";
});

const formattedEndDate = computed(() => {
    return combinedEndDate.value ? formatDate(combinedEndDate.value) : "Select a date";
});


const isValid = computed(() => {
    if (selected.value === options[0].key && combinedStartDate.value) {
        // Only a start date is provided (no end date).
        return isValidStartDate(combinedStartDate.value);
    } else if (combinedStartDate.value && combinedEndDate.value) {
        // Both start and end dates are provided.

        const validity = isValidStartDate(combinedStartDate.value) &&
            isAtLeastOneHourInFuture(combinedEndDate.value);

        console.log(`Validity: ${validity}`)
        return validity;
    }
    return false;
});

const emit = defineEmits(['is-valid']);

// Error messages for date validation
const startDateError = ref<string | null>(null);
const endDateError = ref<string | null>(null);
const startTimeError = ref<string | null>(null);
const endTimeError = ref<string | null>(null);

// Check start date validity and set error message
function validateStartDate(date: Date | null): boolean {
    if (!date) {
        startDateError.value = "Please select a start date";
        return false;
    }
    
    if (date.getTime() < now.getTime()) {
        startDateError.value = null;
        startTimeError.value = "Select a time in the future";
        return false;
    }
    
    startDateError.value = null;
    startTimeError.value = null;
    return true;
}

// Check end date validity and set error message
function validateEndDate(date: Date | null): boolean {
    if (!date) {
        if (selected.value === options[1].key) {
            endDateError.value = "Please select an end date";
            return false;
        }
        endDateError.value = null;
        endTimeError.value = null;
        return true;
    }
    
    const threshold = now.getTime() + 60 * 60 * 1000; // 1 hour in ms
    if (date.getTime() < threshold) {
        endDateError.value = null; // Let the time error handle this
        endTimeError.value = "End time must be at least 1 hour in the future";
        return false;
    }
    
    endDateError.value = null;
    endTimeError.value = null;
    return true;
}

// Allow start dates that are today or in the future
function isValidStartDate(dateValue: Date): boolean {
    return validateStartDate(dateValue);
}

// Ensure end dates are at least one hour in the future
function isAtLeastOneHourInFuture(dateValue: Date): boolean {
    return validateEndDate(dateValue);
}

// Watch for changes in dates to validate in real-time
watch(combinedStartDate, (newDate) => {
    if (newDate) {
        validateStartDate(newDate);
    } else {
        startDateError.value = "Please select a start date";
    }
});

watch(combinedEndDate, (newDate) => {
    if (selected.value === options[1].key) {
        if (newDate) {
            validateEndDate(newDate);
        } else {
            endDateError.value = "Please select an end date";
        }
    } else {
        endDateError.value = null;
    }
});

// Watch for changes in times to validate in real-time
watch(startTime, () => {
    if (combinedStartDate.value) {
        validateStartDate(combinedStartDate.value);
    }
});

watch(endTime, () => {
    if (combinedEndDate.value) {
        validateEndDate(combinedEndDate.value);
    }
});

// Also update the watch for selected toggle to clear errors when changing between date types
watch(selected, (newValue) => {
    if (newValue === options[0].key) {
        // No end date mode
        endDateError.value = null;
        endTimeError.value = null;
    } else {
        // With end date, validate if we have an end date
        if (combinedEndDate.value) {
            validateEndDate(combinedEndDate.value);
        } else {
            endDateError.value = "Please select an end date";
        }
    }
});

watch(isValid, (newValue) => {
    emit('is-valid', newValue);
});


defineExpose({ isValid });

</script>

<style>
.custom-text-field .v-field__input {
    color: rgba(255, 255, 255, 0.4) !important;
}

.v-select .v-field__input {
    color: rgba(255, 255, 255, 0.4) !important;
}

.date-box {
    white-space: nowrap;
}

.token-selection {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
    gap: 6px;
    border-radius: 16px;
    border: 1px solid rgba(236, 236, 236, 0.1);
}

.nav-chip {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    border: none;
}

.nav-chip {
    width: 20px;
    height: 20px;
    padding: 12px;
}

.rotate {
    transform: rotate(180deg);
}

.testclass {
    background-color: rgba(30, 30, 30, 1);
    color: white;

    .dp__calendar_header {
        visibility: hidden;
        height: 0px;
    }

    .dp__calendar_header_item {
        color: white;
    }

    --dp-cell-border-radius: 12px;
    --dp-cell-size: 35px;
    --dp-border-color: transparent;
    --dp-hover-icon-color: black;
    --dp-hover-color: #f3f3f31c;
    --dp-menu-border-color: transparent;
    --dp-border-radius: 8px;
    --dp-font-size: 14px;

    .dp__cell_disabled {
        background-color: transparent;
        color: rgba(158, 158, 158, 1);
    }

}


.dp__cell_inner {
    background-color: rgba(24, 24, 24, 1);
    border-color: rgba(30, 30, 30, 1);
    border-width: 2px;
    border-radius: 10px;
    color: white;

}

.custom-date-picker .dp__range_between {

    background-color: #476b96 !important;
    color: white !important;
    border-color: #476b96;
    border-radius: 0px;
}


.custom-date-picker .dp__range_start {
    color: black !important;
    background: linear-gradient(144deg, #6163E3 11.98%, #CC79D5 43.2%, #BEADE1 50.31%, #B6CBE8 68.15%, #68A0ED 89.06%);
    border-width: 0px;
    border-radius: 0px;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
}

.custom-date-picker .dp__active_date {
    background: linear-gradient(144deg, #6163E3 11.98%, #CC79D5 43.2%, #BEADE1 50.31%, #B6CBE8 68.15%, #68A0ED 89.06%);

}

.custom-date-picker .dp__range_end {
    color: black !important;
    background: linear-gradient(144deg, #6163E3 11.98%, #CC79D5 43.2%, #BEADE1 50.31%, #B6CBE8 68.15%, #68A0ED 89.06%);
    border-width: 0px;
    border-radius: 0px;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;

}

.error-text {
    color: #e74c3c;
    font-size: 14px;
    margin-top: 4px;
}

.time-error {
    margin-top: -16px;
    margin-bottom: 16px;
}
</style>