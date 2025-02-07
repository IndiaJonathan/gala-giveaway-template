<script setup lang="ts">
defineProps<{
    label?: string;
}>();
</script>

<template>
    <button class="custom-button">
        <slot class="button-text">{{ label }}</slot>
    </button>
</template>

<style scoped>
.custom-button {
    padding: 12px 36px;
    background-color: #4a4a4a;
    color: white;
    font-size: 16px;
    border: none;
    border-radius: 100px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s, opacity 0.5s;
}

.custom-button:hover {
    background-color: #333333;
    transform: scale(1.05);
}
</style>
