<script setup>
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { DB } from "@/config/config.js";
import { useTimerStore } from "@/scripts/stores/index.js";
const timerStore = useTimerStore();

// const snackBar = inject("$SnackBar");

const addStartNumberDialog = ref(false);
const newNr = ref(null);
const valid = ref(true);
const startNumber = ref(null);
const snackbar = ref(false);

const { getStartNumbers } = storeToRefs(timerStore);

// watch for backend changes in the Starter Array
watch(getStartNumbers, async (newStarterArray, oldStarterArray) => {
  if (newStarterArray.length === 0 || newStarterArray.toString() === oldStarterArray.toString()) return; // no change for registrants/starters
  // TODO check if a starter on stage was deleted in backend
  snackbar.value = true;
});

const getTryCountText = (sn) => {
  // const passedCount = Object.keys(timerStore.finishedStarter).filter((starter) => starter === sn).length;
  const passedCount = timerStore.finishedStarter[sn] ? timerStore.finishedStarter[sn].length : 0;
  if (timerStore.getTryCountMode === "MIN") {
    return `${passedCount + 1}.Versuch`;
  }

  if (passedCount === 0) return "1.Versuch";
  if (passedCount === timerStore.user.usertype.stageMaxTryCount - 1) return "letzter Versuch";
  if (passedCount === timerStore.user.usertype.stageMaxTryCount) return "kein Versuch mehr möglich";

  return `${passedCount + 1}.Versuch`;
};

const isStarterDisabled = (sn) => {
  if (timerStore.user.usertype.stageMaxTryCount === 0) return false; // no limit for try count
  return timerStore.finishedStarter[sn] && timerStore.finishedStarter[sn].length >= timerStore.user.usertype.stageMaxTryCount;
};

const isAddStarterDisabled = () => {
  if (timerStore.isEvent) {
    return false;
  }
  return timerStore.starters.length >= timerStore.getMaxStartNumber;
};

const addStartNumber = () => {
  timerStore.starters.push({ [DB.REGISTRANT_FIELD_STARTNUMBER]: newNr.value });
  startNumber.value = newNr.value;
  addStartNumberDialog.value = false;
  newNr.value = null;
};

const getRules = [
  (value) => !!value || "Mindestens ein Zeichen",
  (value) => (value && value.length <= 5) || "Max. 5 Zeichen",
  (value) => !timerStore.getStartNumbers.includes(value) || "Startnummer existiert bereits ",
];
</script>
<template>
  <v-card v-if="timerStore.showCounterPartWarning" class="mx-auto elevation-4" width="400">
    <v-card-title class="bgRed text-white"> <v-icon>mdi-timer-sand</v-icon>"Stage not ready"</v-card-title>
    <v-card-text class="ma-2 text-center text-grey">
      {{ `Bitte warten bis Zeitnehmer [${timerStore.isStart ? "Ziel" : "Start"}] angemeldet ist` }}
    </v-card-text>
  </v-card>

  <v-sheet v-else class="elevation-0 align-center justify-center zRelative">
    <div v-if="isAddStarterDisabled()" class="text-center text-red" style="font-size: 0.7em">Maximale Starterzahl erreicht</div>
    <v-select
      v-model="timerStore.selectedStarter"
      class="font-weight-bold"
      label="Startnummer"
      :items="timerStore.getStartNumbers"
      variant="solo-inverted"
      hide-details
      clearable
      @click:clear="timerStore.selectedStarter = null"
    >
      <!-- Add Startnumber for Popups -->
      <template v-slot:append v-if="timerStore.isPopup">
        <v-dialog v-model="addStartNumberDialog" persistent max-width="290">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" v-if="!isAddStarterDisabled()">
              <v-icon color="grey-darken-1" x-large> mdi-plus-box</v-icon></v-btn
            ></template
          ><v-card>
            <v-card-title class="text-h6 text-wrDarkGreen"> Starter hinzufügen? </v-card-title>
            <v-card-text>
              <v-form v-model="valid">
                <v-text-field class="text-wrDarkGreen" density="compact" v-model="newNr" variant="outlined" :rules="getRules">
                </v-text-field
              ></v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn icon @click="addStartNumberDialog = false"> <v-icon color="grey"> mdi-close</v-icon> </v-btn><v-spacer></v-spacer>
              <v-btn icon @click="addStartNumber" :disabled="!valid">
                <v-icon color="wrDarkGreen" x-large> mdi-plus-box</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card></v-dialog
        >
      </template>
      <template v-slot:item="{ props, item }">
        <v-list-item
          v-bind="props"
          :title="item.value"
          class="ma-4 text-wrDarkGreen font-weight-bold elevation-2"
          :disabled="isStarterDisabled(item.value)"
        >
          <template v-slot:append
            ><span class="text-disabled" style="font-size: 0.8em">{{ getTryCountText(item.value) }} </span></template
          >
        </v-list-item>
      </template>
    </v-select>
    <v-snackbar v-model="snackbar" location="top" :timeout="1500" color="success" variant="tonal">Starterliste aktualisiert</v-snackbar>
  </v-sheet>
</template>

<style scoped>
.bgRed {
  background: rgb(241, 11, 11);
  background: linear-gradient(173deg, rgba(241, 11, 11, 1) 0%, rgba(235, 222, 219, 1) 100%);
}
</style>
