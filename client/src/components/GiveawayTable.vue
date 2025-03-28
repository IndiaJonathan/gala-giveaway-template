<template>
  <div>
    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      size="64"
      class="mx-auto my-12 d-block"
    ></v-progress-circular>

    <template v-else>
      <v-table v-if="items.length > 0">
        <thead>
          <tr>
            <th class="text-left">#</th>
            <th 
              v-for="header in headers" 
              :key="header.key" 
              :class="header.align || 'text-left'"
            >
              {{ header.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="item._id || index">
            <td>{{ index + 1 }}</td>
            <td v-for="header in headers" :key="header.key" :class="header.align || 'text-left'">
              <slot :name="header.key" :item="item" :index="index">
                {{ getItemValue(item, header.key) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-alert v-else type="info" class="ma-4">{{ emptyMessage }}</v-alert>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';

interface TableHeader {
  key: string;
  title: string;
  align?: string;
  formatter?: (item: any) => any;
}

const props = defineProps({
  headers: {
    type: Array as () => TableHeader[],
    required: true
  },
  items: {
    type: Array as () => any[],
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyMessage: {
    type: String,
    default: 'No items found.'
  }
});

// Helper function to get nested property values (e.g., 'giveaway.endDateTime')
const getItemValue = (item: any, key: string) => {
  // Check if there's a formatter for this header
  const header = props.headers.find(h => h.key === key);
  if (header && header.formatter) {
    return header.formatter(item);
  }
  
  if (!key.includes('.')) {
    return item[key];
  }
  
  return key.split('.').reduce((obj, k) => obj && obj[k], item);
};
</script> 