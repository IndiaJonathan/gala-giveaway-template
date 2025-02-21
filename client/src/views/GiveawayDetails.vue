<template>
    <TokenSelect ref="tokenSelectRef" @is-valid="handleValidityChange" :balances="balances"
        v-model:selected-token="giveawaySettings.giveawayToken" :created-tokens="createdTokens" :metadata="metadata"
        :clickable="true" style="margin-bottom: 40px;">
    </TokenSelect>
    <WinnerSelector ref="winnerSelectorRef" @is-valid="handleValidityChange" style="margin-bottom: 40px;"
        :isOpen="!!giveawaySettings.giveawayToken">
    </WinnerSelector>
    <DateSelector ref="dateSelectorRef" @is-valid="handleValidityChange" :isOpen="!!giveawaySettings.giveawayToken">
    </DateSelector>
</template>

<script lang="ts" setup>
import WinnerSelector from '@/components/WinnerSelector.vue'
import TokenSelect from '@/components/TokenSelect.vue'
import DateSelector from '@/components/DateSelector.vue';
import { useProfileStore } from '@/stores/profile';
import { storeToRefs } from 'pinia';
import { ref, watch, type Ref } from 'vue';
import { useCreateGiveawayStore } from '@/stores/createGiveaway';

const profileStore = useProfileStore();
const giveawayStore = useCreateGiveawayStore();
const { giveawaySettings } = storeToRefs(giveawayStore)


const tokenSelectRef = ref();
const winnerSelectorRef = ref();
const dateSelectorRef = ref();

const isValid = ref(false);


const { profile, isConnected, error, balances, metadata, createdTokens, connectedEthAddress, connectedUserGCAddress } = storeToRefs(profileStore)
const emit = defineEmits(['is-valid']);

const date = ref(new Date());

// Get tomorrow's date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow


const handleValidityChange = () => {
    const isTokenRefValid = tokenSelectRef.value && tokenSelectRef.value.isValid;
    const isWinnerRefValid = winnerSelectorRef.value && winnerSelectorRef.value.isValid;
    const isDateRefValid = dateSelectorRef.value && dateSelectorRef.value.isValid;

    isValid.value = isTokenRefValid && isWinnerRefValid && isDateRefValid;
};

watch(isValid, (newValue) => {
    emit('is-valid', newValue);
});


defineExpose({ isValid });

</script>
