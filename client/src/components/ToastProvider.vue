<template>
  <slot></slot>
</template>

<script lang="ts" setup>
import { useToast } from '@/composables/useToast'

useToast()
</script>
