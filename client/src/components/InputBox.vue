<script setup lang="ts">
import { ref } from "vue";

defineProps<{
    placeholder?: string;
}>();

const inputValue = ref("");
</script>

<template>
    <div class="input-container">
        <input v-model="inputValue" :placeholder="placeholder" class="input-box" />
        <div class="slot-button">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.input-container {
    display: flex;
    align-items: center;
    width: 602px;
    height: 57px;
    border-radius: 12px;
    padding: 0 12px;
    background-color: rgba(255, 255, 255, 0.03);
}


.input-box::placeholder {
    color: rgba(255, 255, 255, 0.4);
    font-size: 16px;
    opacity: 0.7;
}

.input-box {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: white;
    font-size: 16px;
}

.slot-button {
    margin-left: auto;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    font-size: 14px;
}
</style>
