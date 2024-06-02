import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import * as fs from "fs";
import moment from "moment";

const packageJson = String(fs.readFileSync("./package.json"));
const packageData = JSON.parse(packageJson);
const packageVersionText = packageData.version || "0.0.0";

const date = moment(Date.now()).format("DD.MM.YYYY HH:mm");

// https://vitejs.dev/config/
export default defineConfig({
  base: "/timer/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // enable jest-like global test APIs
    globals: true,
    // simulate DOM with happy-dom
    environment: "happy-dom",
  },
  define: {
    __APP_VERSION__: `"${packageVersionText}"`,
    __BUILD_DATE__: `"${date}"`,
  },
});
