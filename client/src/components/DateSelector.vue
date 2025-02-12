<template>
    <div class="token-selection">
        <h5 style="margin-bottom: 12px;">Schedule Giveaway <span class="required">*</span></h5>
        <p style="margin-bottom: 32px;" class="explanatory-text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur iaculis pharetra lectus quis dictum.
            Etiam vulputate orci vel orci auctor pellentesque.
        </p>

        <ToggleSwitch style="margin-bottom: 32px;" :options="options"></ToggleSwitch>


        <v-row class="giveaway-dates">
            <v-col style="width: 50%;">
                <div class="date-box">
                    <p class="subtitle">GIVEAWAY START DATE</p>
                    <p class="paragraph-small-regular">{{ formattedStartDate }}</p>
                </div>
            </v-col>
            <v-col style="width: 50%;">
                <div class="date-box">
                    <p class="subtitle">GIVEAWAY END DATE</p>
                    <p class="paragraph-small-regular">{{ formattedEndDate }}</p>
                </div>
            </v-col>
        </v-row>


        <VueDatePicker v-model="selectedDates" range inline auto-apply :enable-time-picker="false" :min-date="tomorrow"
            :ui="{ calendar: 'testclass', menu: 'testclass' }" class="custom-date-picker">

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


        <v-row style="margin-top: 16px; margin-bottom: 4px;">
            <v-col>
                <div class="date-box">
                    <p class="paragraph-large-bold">Time</p>
                </div>
            </v-col>
        </v-row>



        <v-row style="width: 100%;">
            <v-col cols="3">
                <v-text-field rounded="lg" variant="solo" bg-color="grey-darken-4" class="hours" label="Hours"
                    v-model="hours" type="number" min="0" max="23"></v-text-field>
            </v-col>

            <v-col cols="3">
                <v-text-field rounded="lg" variant="solo" bg-color="grey-darken-4" label="Minutes" v-model="minutes"
                    type="number" min="0" max="59"></v-text-field>
            </v-col>

            <v-col cols="6">
                <v-select label="Time Zone" v-model="selectedTimezone" :items="timezones" density="compact"></v-select>
            </v-col>
        </v-row>

    </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import ToggleSwitch from './ToggleSwitch.vue';

const selectedDates = ref<Date[]>([]);

// Get tomorrow's date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);
const options: [string, string] = ["No end date", "Set end date"]


//TODO: unhardcode

const hours = ref("13");
const minutes = ref("00");
const selectedTimezone = ref("UK, Ireland, Lisbon time (12:23)");
const timezones = ref([
    "UTC (12:23)",
    "UK, Ireland, Lisbon time (12:23)",
    "Central European Time (CET) (13:23)",
    "Eastern Time (ET) (07:23)",
    "Pacific Time (PT) (04:23)",
    "Indian Standard Time (IST) (17:53)",
    "Japan Standard Time (JST) (21:23)",
]);

const formattedStartDate = computed(() =>
    selectedDates.value.length > 0 ? formatDate(selectedDates.value[0]) : "Select a date"
);

const formattedEndDate = computed(() =>
    selectedDates.value.length > 1 ? formatDate(selectedDates.value[1]) : "Select a date"
);


function formatDate(date: Date): string {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(new Date(date));
}
</script>

<style>
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
    --dp-border-radius: 24px;

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
    background: linear-gradient(135deg,
            #ff4dff,
            #8c52ff,
            #52a0ff) !important;
    border-width: 0px;
    border-radius: 0px;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;



}

.custom-date-picker .dp__range_end {
    color: black !important;
    background: linear-gradient(135deg,
            #ff4dff,
            #8c52ff,
            #52a0ff) !important;
    border-width: 0px;
    border-radius: 0px;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;

}
</style>