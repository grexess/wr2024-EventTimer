<script setup>
import { inject, ref, computed, onMounted, onUnmounted } from "vue";
import { useTimerStore } from "@/scripts/stores/index.js";
const timerStore = useTimerStore();

const snackBar = inject("$SnackBar");

const crud = inject("$CRUD");

const openSnackBar = (o) => {
  snackBar.value.open(o);
};

const progressItems = computed(() => {
  return timerStore.progressItems.reduce((acc, item) => {
    if (!item.solved || currentTime.value - item.solved < 3000) {
      acc.push({
        sn: item.sn,
        result: item.result,
        date: Math.round((currentTime.value - item.date) / 1000),
        solved: item.solved,
      });
    }
    return acc;
  }, []);
});

const currentTime = ref(Date.now());
const offline = ref(!navigator.onLine);

let intervalId;

const updateOnlineStatus = (e) => {
  const { type } = e;
  offline.value = type !== "online";
};

onMounted(() => {
  intervalId = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
  window.addEventListener("offline", updateOnlineStatus);
  window.addEventListener("online", updateOnlineStatus);
});

onUnmounted(() => {
  clearInterval(intervalId);
  window.removeEventListener("offline", updateOnlineStatus);
  window.removeEventListener("online", updateOnlineStatus);
});
import NumberSelection from "@/components/startPage/NumberSelection.vue";
import StartTime from "@/components/startPage/StartTime.vue";
import ResetTime from "@/components/startPage/ResetTime.vue";
import StopTime from "@/components/startPage/StopTime.vue";
import ValueInput from "@/components/startPage/ValueInput.vue";

// import ApplePage from "../components/startPage/ApplePage.vue";

const fetchData = () => {
  crud.value.crudNonConfirmAction("read", timerStore.fetchData, { obj: "Resultate" });
};

fetchData();
</script>
<template>
  <v-container class="fill-height" style="background-color: #fff; max-width: 470px">
    <div class="container mx-1">
      <!-- <ApplePage /> -->
      <NumberSelection v-if="timerStore.showSelection" />
      <TransitionGroup name="roll"> <StartTime v-if="timerStore.showStartTimer" @start="openSnackBar" /></TransitionGroup>
      <TransitionGroup name="roll"> <ResetTime v-if="timerStore.showResetTimer" @reset="openSnackBar" /></TransitionGroup>
      <TransitionGroup name="roll"> <StopTime v-if="timerStore.showStopTimer" @stop="openSnackBar" /></TransitionGroup>
      <TransitionGroup name="roll"> <ValueInput v-if="timerStore.isResultKeeping" @save="openSnackBar" /></TransitionGroup>
      <div v-for="(n, i) in progressItems" :key="i">
        <div v-if="n.solved" class="text-center text-green" style="font-size: 0.7em">Ergebnis für [{{ n.sn }}] gespeichert</div>
        <div v-else class="text-center" style="font-size: 0.7em">
          <span class="text-grey">{{ n.sn }} | {{ n.result }} </span
          ><span :class="n.date > 3 ? 'text-red' : 'text-grey'">| {{ n.date }} sec</span>
          <v-progress-linear color="grey" indeterminate height="10"></v-progress-linear>
        </div>
      </div>
    </div>
    <VLayoutItem model-value position="bottom" class="text-end" size="88">
      <div class="ma-4">
        <v-btn @click="fetchData" icon="mdi-refresh" size="large" color="blue" elevation="8" />
      </div>
    </VLayoutItem>

    <v-dialog v-model="offline" max-width="400" persistent>
      <v-card
        color="red"
        dark
        prepend-icon="mdi-connection"
        text="Bitte versuche eine Internetverbindung herzustellen ..."
        title="Internetverbindung unterbrochen!"
      >
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style></style>
