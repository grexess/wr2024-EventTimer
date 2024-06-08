<script setup>
import { ref, computed } from "vue";

import { useTimerStore } from "@/scripts/stores/index.js";
const timerStore = useTimerStore();

const dialog = ref(false);
const resolve = ref(null);
const reject = ref(null);

const items = computed(() => {
  const data = [
    { title: "Event", text: timerStore.getEventName },
    { title: "Version", text: __APP_VERSION__ },
    { title: "Build", text: __BUILD_DATE__ },
    { title: "Umgebung", text: getEnv() },
    { title: "Session-Observer", icon: getSubscription("sessionObserverSubscription") },
    { title: "TimeTable-Observer", icon: getSubscription("timeTableSubscription") },
  ];

  if (["MODE_ONLY_STARTTIME", "MODE_STARTSTOP"].includes(timerStore.mode)) {
    data.push({ title: "Starter-Observer", icon: getSubscription("starterNumberSubscription") });
  }

  return data;
});

const getEnv = () => {
  if (window.origin.includes("localhost")) return "LOCAL";
  if (window.origin.includes("weracetest")) return "TEST";
  if (window.origin.includes("weracedev")) return "DEV";
  return "PRD";
};

const getSubscription = (v) => {
  return {
    icon: timerStore[v].subscribed ? "mdi-web" : "mdi-web-off",
    color: timerStore[v].subscribed ? "green" : "red",
  };
};

const open = () => {
  dialog.value = true;

  return new Promise((res, rej) => {
    resolve.value = res;
    reject.value = rej;
  });
};

const close = () => {
  dialog.value = false;
  resolve.value(true);
};

defineExpose({
  open,
  close,
});
</script>

<template>
  <v-dialog v-model="dialog" width="auto" max-width="90%">
    <v-card>
      <v-card-title class="bg-wrDarkGreen">WeRace-Timer</v-card-title>
      <v-card-text class="text-center pa-2">
        <v-card v-for="i in items" :key="i" class="ma-2 elevation-2">
          <div v-if="i.text" style="">{{ i.text }}</div>
          <v-icon v-if="i.icon" :color="i.icon.color">{{ i.icon.icon }}</v-icon>
          <div style="font-size: 0.7em">{{ i.title }}</div>
        </v-card>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn icon="mdi-close" color="grey" @click="close" />
        <v-spacer />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
