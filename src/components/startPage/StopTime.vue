<script setup>
import { inject } from "vue";
const loadingComponent = inject("$LoadingComponent");
const infoDialog = inject("$InfoDialog");
import { useTimerStore } from "@/scripts/stores/index.js";
const timerStore = useTimerStore();

const emit = defineEmits(["stop"]);

const stopStarter = async (starter) => {
  const loader = loadingComponent.value;
  try {
    loader.open();
    await timerStore.stopSelectedStarter(starter);
    emit("stop", { text: `Startnummer ${starter} gestoppt` });
  } catch (error) {
    await infoDialog.value.open({
      title: "Starter - STOP",
      text: error.message || error,
      color: "red",
    });
  } finally {
    loader.close();
  }
};
</script>
<template>
  <v-card v-if="timerStore.showCounterPartWarning" class="mx-auto bg-red-lighten-5 text-red" width="300" prepend-icon="mdi-timer-sand">
    <template v-slot:title> Noch nix los </template>
    <v-card-text class="text-center text-grey"> Bitte warten bis Gegenstelle für die Zeitnahme angemeldet ist </v-card-text>
  </v-card>
  <v-card v-else-if="!timerStore.getStartNumbersOnStage.length" class="ma-4 pa-4 elevation-4" width="320px">
    <div class="text-center text-secondary">Derzeit niemand auf Strecke.</div>
    <v-divider class="ma-2" />
    <div class="text-center text-disabled text-caption">
      {{ timerStore.mode !== "MODE_STARTSTOP" ? "Gestartete Teilnehmer erscheinen automatisch." : "" }}
    </div>
  </v-card>
  <v-sheet v-else class="elevation-4 box d-flex align-center justify-center my-2 zRelative">
    <!-- <v-sheet class="legend rounded elevation-4 pa-1" color="white">
      <v-img class="" src="./stopWatch.png" cover :width="25"></v-img>
    </v-sheet> -->
    <TransitionGroup name="backUp" tag="button" class="d-flex flex-wrap justify-center pa-4">
      <v-btn
        class="d-flex align-center justify-center text-white ma-2"
        :elevation="12"
        :height="150"
        :width="150"
        color="red"
        rounded="xl"
        v-for="(sn, idx) in timerStore.getStartNumbersOnStage"
        :key="idx"
        @click="stopStarter(sn)"
        ><div class="text-center">
          <span class="text-caption">Startnummer</span><br />
          <span class="text-h5">{{ sn }}</span
          ><br /><v-divider />
          <span class="text-caption">STOP</span>
        </div></v-btn
      >
    </TransitionGroup>
  </v-sheet>
</template>
