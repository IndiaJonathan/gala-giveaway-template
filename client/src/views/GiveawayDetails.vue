<template>
    <TokenSelect :balances="balances" style="margin-bottom: 40px;"></TokenSelect>
    <WinnerSelector></WinnerSelector>
</template>

<script lang="ts" setup>
import WinnerSelector from '@/components/WinnerSelector.vue'
import TokenSelect from '@/components/TokenSelect.vue'
import { useProfileStore } from '@/stores/profile';
import { storeToRefs } from 'pinia';


const emit = defineEmits<{
    (e: 'form-valid', formIsValid: boolean): void
}>()

const profileStore = useProfileStore();
const { profile, isConnected, error, balances, connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)

</script>


<style></style>