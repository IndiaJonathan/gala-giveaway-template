<template>
  <v-form ref="form">
    <v-row>
      <!-- Collection Input -->
      <v-col cols="12" md="6">
        <v-text-field
          :readonly="readOnly"
          :disabled="readOnly"
          placeholder="Token"
          v-model="tokenClass.collection"
          label="Collection"
          :rules="[rules.required]"
          required
        ></v-text-field>
      </v-col>

      <!-- Category Input -->
      <v-col cols="12" md="6">
        <v-text-field
          :readonly="readOnly"
          :disabled="readOnly"
          placeholder="Unit"
          v-model="tokenClass.category"
          label="Category"
          :rules="[rules.required]"
          required
        ></v-text-field>
      </v-col>

      <!-- Type Input -->
      <v-col cols="12" md="6">
        <v-text-field
          :readonly="readOnly"
          :disabled="readOnly"
          placeholder="<your token's symbol>"
          v-model="tokenClass.type"
          label="Type"
          :rules="[rules.required]"
          required
        ></v-text-field>
      </v-col>

      <!-- Additional Key Input -->
      <v-col cols="12" md="6">
        <v-text-field
          :readonly="readOnly"
          :disabled="readOnly"
          v-model="tokenClass.additionalKey"
          label="Additional Key"
          :rules="[rules.required]"
          required
        ></v-text-field>
      </v-col>

      <!-- Quantity Input (Optional) -->
      <v-col cols="12" md="6" v-if="showQuantity">
        <v-text-field
          :label="quantityLabel"
          required
          v-model="quantity"
          min="1"
          type="number"
        ></v-text-field>
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup lang="ts">
import type { TokenClassKeyProperties } from '@gala-chain/api';
import { ref, watch, type PropType } from 'vue'

const emit = defineEmits(['update:tokenClass', 'update:quantity'])

const props = defineProps({
  tokenClass: {
    type: Object as PropType<TokenClassKeyProperties>,
    required: true
  },
  quantity: {
    type: String,
    required: false
  },
  quantityLabel: {
    type: String,
    default: "Quantity"
  },
  showQuantity: {
    type: Boolean,
    default: false
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

const quantity = ref(Number(props.quantity))

const rules = {
  required: (value: any) => !!value || 'Required.',
  greaterThanZero: (value: number) => value > 0 || 'Must be greater than 0.'
}

const form = ref()

function validate() {
  return form.value.validate()
}

watch(
  () => props.tokenClass,
  (newVal) => {
    emit('update:tokenClass', newVal);
  },
  { deep: true }
);

watch(quantity, (newVal) => {
  emit('update:quantity', newVal);
});

defineExpose({
  validate
})
</script>
