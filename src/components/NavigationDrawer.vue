<script setup>
import { computed, inject, ref } from "vue";
import { useTimerStore } from "@/scripts/stores/index.js";
import { useRouter } from "vue-router";

const timerStore = useTimerStore();
const router = useRouter();

const infoDialog = inject("$InfoDialog");
const loadingComponent = inject("$LoadingComponent");

import AboutDialog from "@/components/framework/AboutDialog.vue";
const aboutDialog = ref(null);

const navItems = computed(() =>
  router
    .getRoutes()
    .filter((route) => route.meta.inNav)
    .map(({ meta: { title }, path }) => ({ title, path }))
);

const logout = async () => {
  const loader = loadingComponent.value;
  try {
    loader.open();
    await timerStore.logout();
    router.push({ name: "login" });
  } catch (error) {
    if (error.code !== 209) {
      loader.close();
      infoDialog.value.open({
        title: "Fehler",
        text: error.message || error,
        color: "red",
      });
    } else {
      //TODO: handle session invalid
      await timerStore.logout();
    }
  } finally {
    loader.close();
  }
};

const openAbout = () => {
  aboutDialog.value.open();
};
</script>
<template>
  <v-navigation-drawer v-model="timerStore.navDrawer" temporary>
    <v-list nav base-color="wrDarkGreen">
      <v-list-item v-for="(item, idx) in navItems" :key="idx" :prepend-icon="item.icon" :title="item.title" :to="item.path"></v-list-item>
      <v-list-item title="Abmelden" @click="logout()" prependIcon="mdi-logout"></v-list-item>
      <v-list-item title="Info" @click="openAbout()" prependIcon="mdi-information-variant-box-outline"></v-list-item>
    </v-list>
    <AboutDialog ref="aboutDialog" />
  </v-navigation-drawer>
</template>
