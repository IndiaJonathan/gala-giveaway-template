<script setup lang="ts">
import { computed } from "vue";
import BigNumber from "bignumber.js";

const props = withDefaults(defineProps<{
  modelValue?: BigNumber;
  placeholder?: string;
  onSlotClick?: () => void;
  editable?: boolean;
}>(), {
  editable: true,
});

const emit = defineEmits<{
  (event: "update:modelValue", value?: BigNumber): void;
}>();

const inputValue = computed({
  get: () => props.modelValue ? props.modelValue.toString() : '',
  set: (value: string) => {
    try {
        if (value === ''){
            emit("update:modelValue", undefined);
            return undefined;
        }
        const bn = new BigNumber(value);
    if (bn.isNaN()) {
      // If not valid, emit undefined.
      emit("update:modelValue", undefined);
      return;
    }
    // Otherwise, emit the BigNumber.
    emit("update:modelValue", bn);
    } catch (error) {
      console.error("Invalid number input", value, error);
    }
  }
});

const handleSlotClick = () => {
  if (props.onSlotClick) {
    props.onSlotClick();
  }
};
</script>

<template>
  <div class="input-container">
    <input
      v-model="inputValue"
      :readonly="!props.editable"
      :class="{'non-editable': !props.editable}"
      :placeholder="placeholder"
      class="input-box"
      inputmode="numeric"
      type="number"
    />
    <div class="slot-button" @click="handleSlotClick">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Hide spin buttons in Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}

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

.input-box.non-editable {
  cursor: not-allowed;
}

.slot-button {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 14px;
}
</style>
