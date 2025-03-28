<template>
    <div class="token-item" 
         :class="{ 
            selected: isSelected, 
            clickable: clickable 
         }" 
         @click="clickable ? $emit('click') : null">
        <img v-if="tokenImage" class="token-icon" :src="tokenImage" alt="token icon" />
        <div v-else class="token-icon-circle"></div>

        <div class="token-details">
            <div class="token-name paragraph-medium-regular">{{ tokenName }}</div>
            <div class="token-balance paragraph-small-bold">{{ subText }}</div>
        </div>

        <div v-if="isSelected">
            <img src="@/assets/radio-checked.png" alt="Chevron Icon" class="icon" />
        </div>
        <div v-else>
            <img src="@/assets/radio-unchecked.png" alt="Chevron Icon" class="icon" />
        </div>
    </div>
</template>

<script lang="ts" setup>
defineProps({
    tokenImage: {
        type: String,
        default: ''
    },
    tokenName: {
        type: String,
        required: true
    },
    subText: {
        type: String,
        required: true
    },
    isSelected: {
        type: Boolean,
        default: false
    },
    clickable: {
        type: Boolean,
        default: false
    }
});

defineEmits(['click']);
</script>

<style scoped>
.token-item {
    display: flex;
    align-items: center;
    background-color: #181818;
    padding: 16px;
    border-radius: 12px;
    width: 100%;
    transition: background-color 0.3s ease;
}

.token-item.clickable {
    cursor: pointer;
}

.token-item.clickable:hover {
    background-color: #1f1f1f;
}

.token-item.selected {
    border: none;
    box-shadow: inset 0 0 0 1px #ffffff;
}

.token-icon {
    width: 40px;
    height: 40px;
    margin-right: 16px;
}

.token-icon-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #333333;
    margin-right: 16px;
}

.token-details {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.token-name {
    color: white;
}

.token-balance {
    color: #9E9E9E;
    margin-top: 4px;
}
</style> 