<script setup>
import { ref, computed } from "vue";

import { useAppleStore } from "@/scripts/stores/index.js";
const piniaStore = useAppleStore();

piniaStore.initSubscriptions();

const newObject = ref(null);

const subscription = computed(() => {
  return piniaStore.getSubscription;
});
const parseClient = computed(() => {
  return piniaStore.getParseClient;
});
</script>

<template>
  <h1>Hello LiveQueryTest</h1>
  <hr />
  <div>{{ piniaStore.getNewObject }}</div>
  <div v-if="parseClient">
    <h2>LiveQueryClient</h2>
    {{ parseClient }}
    <hr />
    <h2>SubScription</h2>
    {{ subscription }}
  </div>
  <dialog id="myDialog">
    <p>{{ newObject ? newObject.toJSON() : "" }}</p>
    <form method="dialog">
      <button :click="closeDialog">OK</button>
    </form>
  </dialog>
</template>
