<template>
    <div>
      <p class="paragraph-medium-bold mt-8 mb-1">{{ title }}</p>
      <v-row style="width: 100%;">
        <v-col cols="3">
          <v-text-field
            rounded="lg"
            variant="solo"
            bg-color="rgba(255, 255, 255, 0.03)"
            class="custom-text-field"
            v-model="hours"
            type="number"
            min="0"
            max="23"
          ></v-text-field>
        </v-col>
        <v-col cols="3">
          <v-text-field
            rounded="lg"
            variant="solo"
            bg-color="rgba(255, 255, 255, 0.03)"
            class="custom-text-field"
            v-model="minutes"
            type="number"
            min="0"
            max="59"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-select
            v-model="selectedTimezone"
            :items="computedTimezones"
            item-title="label"
            item-value="key"
            class="custom-select"
            variant="solo"
            bg-color="rgba(255, 255, 255, 0.03)"
          ></v-select>
        </v-col>
      </v-row>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  
  const props = defineProps<{
    title: string;
    modelValue?: Date;
    timezone?: string;
  }>();
  
  const emit = defineEmits<{
    (e: 'update:modelValue', value: Date): void;
    (e: 'update:timezone', value: string): void;
  }>();
  
  // Get current time.
  const now = new Date();
  
  // Initialize hours and minutes based on parent's modelValue or current time.
  const hours = ref<string>(
    props.modelValue ? props.modelValue.getHours().toString() : now.getHours().toString()
  );
  const minutes = ref<string>(
    props.modelValue ? props.modelValue.getMinutes().toString() : now.getMinutes().toString()
  );
  
  // List of IANA timezone strings.
  const ianaTimezones = [
    "UTC",
    "Europe/London",
    "Europe/Paris",
    "America/New_York",
    "America/Chicago", // CST
    "America/Los_Angeles",
    "Asia/Kolkata",
    "Asia/Tokyo"
  ];
  
  // Detect the user's IANA timezone.
  const userIanaTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Initialize selectedTimezone from prop or default to the detected timezone.
  const selectedTimezone = ref<string>(props.timezone || userIanaTimezone);
  
  // When hours or minutes change, update the parent's time.
  watch([hours, minutes], () => {
    const h = parseInt(hours.value) || 0;
    const m = parseInt(minutes.value) || 0;
    // Create a new Date using today's date and the specified hours/minutes.
    const updatedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    emit('update:modelValue', updatedDate);
  });
  
  // When the timezone selection changes, update the parent's timezone.
  watch(selectedTimezone, (newTz) => {
    emit('update:timezone', newTz);
  });
  
  // Compute the timezone options dynamically.
  const computedTimezones = computed(() => {
    // Parse the entered hours and minutes.
    const h = parseInt(hours.value) || 0;
    const m = parseInt(minutes.value) || 0;
    // Build a base local date.
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    // Get the local date string for comparison.
    const localDateStr = localDate.toLocaleDateString("en-US");
    
    return ianaTimezones.map(tz => {
      // Format the time in the target timezone.
      const formattedTime = localDate.toLocaleTimeString("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      // Get the target date string in the target timezone.
      const targetDateStr = localDate.toLocaleDateString("en-US", { timeZone: tz });
      let daySuffix = "";
      if (targetDateStr !== localDateStr) {
        // Determine if the target time falls on the next or previous day.
        const localDay = new Date(localDateStr);
        const targetDay = new Date(targetDateStr);
        daySuffix = targetDay.getTime() > localDay.getTime() ? " (Next day)" : " (Previous day)";
      }
      // Replace underscores with spaces in the IANA name.
      const displayTz = tz.replace(/_/g, " ");
      return {
        key: tz,
        label: `${displayTz} (${formattedTime})${daySuffix}`
      };
    });
  });
  </script>
  
  <style scoped>
  .paragraph-medium-bold {
    font-size: 1rem;
    font-weight: bold;
  }
  .mt-8 {
    margin-top: 8px;
  }
  .mb-1 {
    margin-bottom: 4px;
  }
  
  .custom-text-field .v-field__input {
    color: rgba(255, 255, 255, 0.4) !important;
  }
  .v-select .v-field__input {
    color: rgba(255, 255, 255, 0.4) !important;
  }
  
  /* Custom styling for text field and select (if needed) */
  .custom-text-field {
    /* Your custom styles */
  }
  .custom-select {
    /* Your custom styles */
  }
  </style>
  