<template>
    <div class="token-selection">
        <h5 style="margin-bottom: 12px;">Schedule Giveaway <span class="required">*</span></h5>
        <p style="margin-bottom: 32px;" class="explanatory-text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur iaculis pharetra lectus quis dictum.
            Etiam vulputate orci vel orci auctor pellentesque.
        </p>

        <VueDatePicker v-model="selectedDates" range inline auto-apply :enable-time-picker="false" :min-date="tomorrow"
            :ui="{ calendar: 'testclass', menu: 'testclass' }" class="custom-date-picker">

            <template #range-start="{ day }">
                <div class="bookend start">{{ day }}</div>
            </template>

            <!-- Last selected date (Bookend Right) -->
            <template #range-end="{ day }">
                <div class="bookend end">{{ day }}</div>
            </template>

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
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const selectedDates = ref<Date[]>([]);

// Get tomorrow's date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);

</script>

<style>
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