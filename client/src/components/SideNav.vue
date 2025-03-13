<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    floating
    sticky
    :temporary="$vuetify.display.smAndDown"
    :permanent="!$vuetify.display.smAndDown"
    style="background-color: #121212; z-index: 1200;"
    :style="$vuetify.display.smAndDown ? 'height: 100vh; top: 0;' : 'height: 100vh; top: 0; position: fixed;'"
    :overlay="$vuetify.display.smAndDown"
    :close-on-content-click="$vuetify.display.smAndDown"
    app
  >    
    <!-- Logo section for both mobile and desktop -->
    <div class="d-flex align-center pa-4">
      <v-icon icon="mdi-gift-outline" size="large" color="white" class="me-2"></v-icon>
      <span class="text-h6 font-weight-bold white--text">GALACHAIN GIVEAWAYS</span>
    </div>

    <v-list nav class="mt-2">
      <v-list-item prepend-icon="mdi-home" title="Home" value="home" to="/" class="white--text" @click="closeOnMobile"></v-list-item>
      <v-list-item
        prepend-icon="mdi-plus-circle"
        title="Create Giveaway"
        value="create-giveaway"
        to="/create-giveaway"
        class="white--text"
        @click="closeOnMobile"
      ></v-list-item>
      <!-- <v-list-item
        prepend-icon="mdi-help-circle-outline"
        title="About"
        value="about"
        to="/about"
        class="white--text"
        @click="closeOnMobile"
      ></v-list-item> -->

      <v-divider class="my-2"></v-divider>

      <v-list-item
        prepend-icon="mdi-gift-outline"
        title="Won"
        value="won"
        to="/won"
        class="white--text"
        @click="closeOnMobile"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-upload"
        title="Created"
        value="created"
        to="/created"
        class="white--text"
        @click="closeOnMobile"
      ></v-list-item>
    </v-list>

    <template v-slot:append>
      <v-list nav class="mb-2">
        <v-list-item
          prepend-icon="mdi-share-variant"
          title="Refer a friend"
          value="refer"
          class="mb-2 white--text"
          @click="closeOnMobile"
        ></v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';
import { useDisplay } from 'vuetify';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue']);
const display = useDisplay();

const closeOnMobile = () => {
  if (display.smAndDown.value) {
    emit('update:modelValue', false);
  }
};
</script>

<style scoped>
.dollar-sign {
  z-index: 1;
  font-weight: bold;
}
</style>
