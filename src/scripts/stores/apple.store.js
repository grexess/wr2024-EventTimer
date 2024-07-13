import { defineStore } from "pinia";

const applicationId = import.meta.env.VITE_APP_PARSE_APP_ID;
const serverURL = import.meta.env.VITE_APP_PARSE_WSS_URL;
const javascriptKey = import.meta.env.VITE_APP_PARSE_JAVASCRIPT_ID;

import Parse from "parse/dist/parse.min.js";
Parse.serverURL = serverURL;
Parse.initialize(applicationId, javascriptKey);

console.log({ applicationId, serverURL, javascriptKey });

let ParseClient = null;
let Subscription = null;
let LiveQueryClient = null;

try {
  LiveQueryClient = Parse.LiveQueryClient;
  ParseClient = new LiveQueryClient({
    applicationId,
    serverURL,
    javascriptKey,
  });
  ParseClient.open();
  console.log("ParseClient opened", ParseClient);
  const query = new Parse.Query("WR_SESSION_OBSERVER");
  Subscription = ParseClient.subscribe(query);
} catch (err) {
  console.error(err);
}

export const useAppleStore = defineStore("appleStore", {
  state: () => ({ subscription: null, newObject: null }),
  getters: {
    getSubscription(state) {
      return state.subscription.subscribed;
    },
    getParseClient() {
      return ParseClient;
    },
    getNewObject(state) {
      return state.newObject || "empty";
    },
  },
  actions: {
    async initSubscriptions() {
      try {
        Subscription.on("create", (obj) => {
          this.newObject = obj;
          console.log("create", obj);
        });
        Subscription.on("update", (obj) => {
          this.newObject = obj;
          console.log("update", this.newObject);
        });
        Subscription.on("delete", (obj) => {
          this.newObject = obj;
          console.log("delete", obj);
        });
        this.subscription = Subscription;
      } catch (error) {
        console.error(error);
      }
    },
  },
});
