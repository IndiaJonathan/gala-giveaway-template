<template>
    <div class="toggle-container">
        <div :class="['toggle', { 'is-selected': selectedVal === options[0].key }]"
            @click="selectOption(options[0].key)">
            <p :class="['label-medium', selectedVal === options[0].key ? 'selected-text' : 'unselected-text']">
                {{ options[0].label }}
            </p>
        </div>
        <div :class="['toggle', { 'is-selected': selectedVal === options[1].key }]"
            @click="selectOption(options[1].key)">
            <p :class="['label-medium', selectedVal === options[1].key ? 'selected-text' : 'unselected-text']">
                {{ options[1].label }}
            </p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
    options: [
        { key: string; label: string },
        { key: string; label: string }
    ];
    selected?: string;
}>();

const emit = defineEmits<{
    (e: 'update:selected', option: string): void;
}>();

const selectedVal = computed({
    get: () => {
        console.log("compuitin222...")
        return props.selected ?? props.options[0].key
    },
    set: (value: string) => {
        emit('update:selected', value);
    }
});

const selectOption = (optionKey: string) => {
    selectedVal.value = optionKey;
};
</script>

<style scoped>
.selected-text {
    color: rgba(10, 10, 10, 1);
}

.unselected-text {
    color: rgba(255, 255, 255, 0.6);
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
    margin: 5px;
    background: #ffff;
    height: 34px;
    color: #000;
    border-radius: 100px;
}

.toggle:not(:last-child) {
    margin-right: 5px;
}
</style>