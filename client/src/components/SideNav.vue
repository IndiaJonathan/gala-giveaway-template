<template>
  <v-navigation-drawer
    floating
    sticky
    style="background-color: inherit; height: calc(100vh - 108px); top: 108px"
  >
    <v-list nav>
      <v-list-item prepend-icon="mdi-home" title="Home" value="home" to="/"></v-list-item>
      <v-list-item
        prepend-icon="mdi-help-circle"
        title="About"
        value="about"
        to="/about"
      ></v-list-item>

      <v-list-item></v-list-item>

      <v-list-item
        prepend-icon="mdi-gift-open"
        title="Claimed"
        value="claimed"
        to="/claimed"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-upload"
        title="Created"
        value="created"
        to="/created"
      ></v-list-item>
    </v-list>

    <template v-slot:append>
      <v-list nav class="mb-2">
        <v-list-item
          prepend-icon="mdi-share"
          title="Refer a friend"
          value="refer"
          class="mb-2"
        ></v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts" setup></script>
