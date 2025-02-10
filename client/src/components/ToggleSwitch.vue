<template>
    <div class="toggle-container">
        <div :class="['toggle', { 'is-selected': selected === options[0] }]" @click="selectOption(options[0])">
            <p :class="['label-medium', selected === options[0] ? 'selected-text' : 'unselected-text']">{{ options[0] }}</p>
        </div>
        <div :class="['toggle', { 'is-selected': selected === options[1] }]" @click="selectOption(options[1])">
            <p :class="['label-medium', selected === options[1] ? 'selected-text' : 'unselected-text']">{{ options[1] }}</p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const emit = defineEmits<{
    (e: 'update:selected', option: string): void
}>()

const props = defineProps<{
    options: [string, string]; // accepts an array of two options
}>();

const selected = ref(props.options[0]); // default selected option

// Emit the selected option when it's clicked
const selectOption = (option: string) => {
    selected.value = option;
    emit('update:selected', selected.value); // Emits the selected option back to the parent
};
</script>

<style scoped>
.selected-text {
    color: rgba(10, 10, 10, 1)
}

.unselected-text {
    color: rgba(255, 255, 255, 0.6)
}


.toggle-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 5px;
    width: 602px;
    height: 51px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 100px;
}

.toggle {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 15px;
    font-size: 16px;
    cursor: pointer;
}

.is-selected {
    background: #ffff;
    height: 34px;
    color: #000;
    border-radius: 100px;
}

.toggle:not(:last-child) {
    margin-right: 5px;
}
</style>