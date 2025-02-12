<template>
    <TokenSelect :balances="balances" style="margin-bottom: 40px;"></TokenSelect>
    <WinnerSelector style="margin-bottom: 40px;"></WinnerSelector>
    <DateSelector></DateSelector>
</template>

<script lang="ts" setup>
import WinnerSelector from '@/components/WinnerSelector.vue'
import TokenSelect from '@/components/TokenSelect.vue'
import DateSelector from '@/components/DateSelector.vue';
import { useProfileStore } from '@/stores/profile';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';


const emit = defineEmits<{
    (e: 'form-valid', formIsValid: boolean): void
}>()

const profileStore = useProfileStore();
const { profile, isConnected, error, balances, connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)


const date = ref(new Date());

// Get tomorrow's date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow

// Format the date to 'YYYY-MM-DD' for comparison
const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Allowed dates function to only allow tomorrow and beyond
const allowedDates = (val: string) => {
    return formatDate(new Date(val)) >= formatDate(tomorrow);
};
</script>

