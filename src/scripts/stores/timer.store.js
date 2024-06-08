import { defineStore } from "pinia";
import { router } from "@/scripts/router.js";
import { ResultKeepingMap, DB } from "@/config/config.js";

import Parse from "parse/dist/parse.min.js";
Parse.serverURL = import.meta.env.VITE_APP_PARSE_SERVER_URL;
Parse.initialize(import.meta.env.VITE_APP_PARSE_APP_ID, import.meta.env.VITE_APP_PARSE_JAVASCRIPT_ID);
Parse.enableLocalDatastore();

import {
  findParseObjects,
  firstParseObject,
  getParseObject,
  createParseObject,
  updateParseObject,
  deleteParseObject,
} from "@/scripts/parseFunctions.js";

export const useTimerStore = defineStore({
  id: "timerStore",
  persist: {
    storage: sessionStorage,
  },
  state: () => ({
    navDrawer: false,
    user: null,
    returnUrl: null,
    starters: [],
    mode: "MODE_STARTSTOP",
    modeMap: ResultKeepingMap,
    selectedStarter: null,
    isCounterPartAvailable: null,
    starterOnStage: {},
    finishedStarter: {},
    classNameMap: {
      popup: { timeTableClass: "WR_POPUP_TIMETABLE", eventClass: "WR_POPUP" },
      event: { timeTableClass: "WR_EVENT_TIMETABLE", eventClass: "WR_EVENT" },
    },
    parseClient: null,
    sessionObserverSubscription: null,
    timeTableSubscription: null,
    starterNumberSubscription: null,
    sessionTakeOver: false,
  }),

  actions: {
    async fetchData() {
      try {
        let entries;
        switch (this.user.usertype.type) {
          case "popup":
            entries = await findParseObjects({
              className: DB.CLASS_POPUP_TIMETABLE,
              query: { [DB.CLASS_FIELD_POPUPID]: this.user.usertype.popupId },
              select: [DB.CLASS_FIELD_STARTNUMBER, DB.CLASS_FIELD_STARTTIME, DB.CLASS_FIELD_FINISHTIME],
            });
            this.starters = Array.from(
              entries.reduce((acc, cur) => {
                acc.add(cur.get(DB.CLASS_FIELD_STARTNUMBER));
                return acc;
              }, new Set())
            ).map((sn) => ({ [DB.REGISTRANT_FIELD_STARTNUMBER]: sn }));
            break;
          case "event":
            const { eventId, stageName } = this.user.usertype;
            entries = await findParseObjects({
              className: DB.CLASS_EVENT_TIMETABLE,
              query: { [DB.CLASS_FIELD_EVENTID]: eventId, [DB.CLASS_FIELD_STAGE]: stageName },
              select: [DB.CLASS_FIELD_STARTNUMBER, DB.CLASS_FIELD_STARTTIME, DB.CLASS_FIELD_FINISHTIME],
            });

            const startNumbers = await getParseObject(DB.CLASS_EVENT, eventId, [DB.CLASS_ARRAY_REGISTRANTS]);
            this.starters = startNumbers.get(DB.CLASS_ARRAY_REGISTRANTS);
            break;
          default:
            break;
        }

        this.starterOnStage = {};
        this.finishedStarter = {};

        for (const cur of entries) {
          const sn = cur.get(DB.CLASS_FIELD_STARTNUMBER);
          const finishTime = cur.get(DB.CLASS_FIELD_FINISHTIME);
          if (!finishTime && !this.starterOnStage[sn]) {
            this.starterOnStage[sn] = cur.id;
          } else if (finishTime) {
            this.finishedStarter[sn] = this.finishedStarter[sn] || [];
            this.finishedStarter[sn].push(cur.id);
          }
        }

        // this.initSubscriptions();
      } catch (error) {
        if (error.code === 209) {
          Parse.User.logOut();
          router.push("/login");
        }
        throw error;
      }
    },

    async startSelectedStarter() {
      let entry;

      switch (this.user.usertype.type) {
        case "popup":
          entry = await createParseObject(DB.CLASS_POPUP_TIMETABLE, {
            [DB.CLASS_FIELD_STARTNUMBER]: this.selectedStarter,
            [DB.CLASS_FIELD_POPUPID]: this.user.usertype.popupId,
            [DB.CLASS_FIELD_STARTTIME]: Date.now(),
          });
          break;
        case "event":
          const { eventId, stageName } = this.user.usertype;
          entry = await createParseObject(DB.CLASS_EVENT_TIMETABLE, {
            [DB.CLASS_FIELD_STARTNUMBER]: this.selectedStarter,
            [DB.CLASS_FIELD_EVENTID]: eventId,
            [DB.CLASS_FIELD_STAGE]: stageName,
            [DB.CLASS_FIELD_STARTTIME]: Date.now(),
          });
          break;

        default:
          break;
      }
      this.starterOnStage[this.selectedStarter] = entry.id;
      this.selectedStarter = null;
    },

    async saveResult(result) {
      let idField;
      switch (this.user.usertype.type) {
        case "popup":
          idField = DB.CLASS_FIELD_POPUPID;
          break;
        case "event":
          idField = DB.CLASS_FIELD_EVENTID;
          break;
        default:
          break;
      }

      await createParseObject(this.classNameMap[this.user.usertype.type].timeTableClass, {
        [idField]: this.user.usertype[this.getUserTypeEvent],
        [DB.CLASS_FIELD_STARTNUMBER]: this.selectedStarter,
        [DB.CLASS_FIELD_RESULT]: result,
        [DB.CLASS_FIELD_STAGE]: this.user.usertype.stageName, // only for event
      });
      this.selectedStarter = null;
    },

    removeSelectedStarter() {
      this.selectedStarter = null;
    },

    async resetSelectedStarter(sn) {
      await deleteParseObject(this.classNameMap[this.user.usertype.type].timeTableClass, this.starterOnStage[sn]);
      delete this.starterOnStage[sn];
    },

    async stopSelectedStarter(sn) {
      const time = await updateParseObject(this.classNameMap[this.user.usertype.type].timeTableClass, this.starterOnStage[sn], {
        [DB.CLASS_FIELD_FINISHTIME]: Date.now(),
      });
      this.finishedStarter[sn] ? this.finishedStarter[sn].push(time.id) : (this.finishedStarter[sn] = [time.id]);
      delete this.starterOnStage[sn];
    },

    toggleNavDrawer() {
      this.navDrawer = !this.navDrawer;
    },

    async login(pin) {
      const _user = await Parse.User.logIn(pin, pin);
      this.user = _user.toJSON();

      //WR_EVENT requires a stageTryCount
      if (this.isEvent && !this.user?.usertype.stageMinTryCount && !this.user?.usertype.stageMaxTryCount)
        throw new Error("TryCount information missing, please contact your organizer!");

      if (this.isPopup) {
        this.user.usertype.stageMaxTryCount = this.user.usertype.popupType === "free5x5" ? 5 : 1000;
      }
      this.mode = this.user.usertype.mode;

      try {
        await this.initSubscriptions(); // init parseClient for LiveQuery
        console.log("initSubscriptions:done");

        // redirect to previous url or default to home page
        router.push(this.returnUrl || "/");
      } catch (error) {
        console.log("login:error", error);
        throw error;
      }
    },

    async callParseFunction(functionName, params) {
      try {
        await Parse.Cloud.run(functionName, params);
      } catch (error) {
        if (error.code === 209) {
          console.log("callParseFunction:session token expired");
          // Session token expired
          this.logout();
        }
      }
    },

    async logout() {
      if (this.parseClient) {
        try {
          this.parseClient.close();
        } catch (error) {}
      }
      await Parse.User.logOut();
      this.$reset();
      localStorage.removeItem("timerStore");
      this.user = null;
      router.push("/login");
    },

    async checkForCounterpart() {
      if (!this.user) return;
      const counterMode = this.user.usertype.mode === "MODE_ONLY_STARTTIME" ? "MODE_ONLY_STOPTIME" : "MODE_ONLY_STARTTIME";
      let queryData = {
        WR_ID: this.user.usertype[this.getUserTypeEvent],
        Target: counterMode,
      };

      if (this.user.usertype.type === "event") {
        queryData.StageName = this.user.usertype.stageName;
      }
      const selectedFields = ["Target", "StageName"];
      try {
        const counterPartSession = await firstParseObject("WR_SESSION_OBSERVER", queryData, selectedFields);
        this.isCounterPartAvailable = counterPartSession ? true : false;
      } catch (err) {
        switch (err.code) {
          case Parse.Error.INVALID_SESSION_TOKEN:
            console.log("checkForCounterpart:session token expired or taken over");
        }
      }
    },

    async checkForSessionTakeOver(wrSession) {
      if (!this.user) return;
      switch (this.user.usertype.type) {
        case "popup":
          this.sessionTakeOver = wrSession.get("Target") === this.mode;
          break;
        case "event":
          this.sessionTakeOver = wrSession.get("Target") === this.mode && wrSession.get("StageName") === this.user.usertype.stageName;
          break;
      }
    },

    /* subscription required for watching state of timetable entries
     *  MODE_ONLY_STARTTIME watches for stoping of runners
     *  MODE_ONLY_STOPTIME watches for reseting of runners
     */
    async subscribeToTimeTableEntries() {
      try {
        const className = this.classNameMap[this.user.usertype.type].timeTableClass;
        const queryData = { EventId: this.user.usertype.eventId };
        if (this.user.usertype.type === "event") {
          queryData.Stage = this.user.usertype.stageName;
        }

        const selectedFields = [DB.CLASS_FIELD_STARTNUMBER, DB.CLASS_FIELD_STARTTIME, DB.CLASS_FIELD_FINISHTIME];
        const query = this.getQuery({ className, queryData, selectedFields });
        this.timeTableSubscription = this.parseClient.subscribe(query, Parse.User.current().get("sessionToken"));

        if (this.mode === "MODE_ONLY_STARTTIME") {
          this.timeTableSubscription.on("update", (time) => {
            const sn = time.get(DB.CLASS_FIELD_STARTNUMBER);
            this.finishedStarter[sn] ? this.finishedStarter[sn].push(time.id) : (this.finishedStarter[sn] = [time.id]);
            delete this.starterOnStage[sn];
          });
        }

        this.timeTableSubscription.on("create", (time) => {
          const sn = time.get(DB.CLASS_FIELD_STARTNUMBER);
          this.starterOnStage[sn] = time.id;
        });
        this.timeTableSubscription.on("delete", (time) => {
          const sn = time.get(DB.CLASS_FIELD_STARTNUMBER);
          delete this.starterOnStage[sn];
        });
      } catch (error) {
        console.log("subscribeToTimeTableEntries:error", error);
        throw error;
      }
    },

    /* subscription required for watching state of timekeeper counterpart
     *  MODE_ONLY_STARTTIME watches for state of finish timekeeper
     *  MODE_ONLY_STOPTIME watches for state of start timekeeper
     */
    async subscribeToSessionObserver() {
      const query = this.getSessionObserverQuery;
      const _sessionObserverSubscription = await this.parseClient.subscribe(query, Parse.User.current().get("sessionToken"));
      // await _sessionObserverSubscription.subscribePromise;
      this.sessionObserverSubscription = _sessionObserverSubscription;

      console.log({ subscribed: this.sessionObserverSubscription.subscribed });

      console.log("Set SessionObserver Subscription [create]");
      this.sessionObserverSubscription.on("create", async (wrSess) => {
        console.log("On SessionObserver [create]");
        // check if own session is taken over by another device
        await this.checkForCounterpart(wrSess);
      });
      console.log("Set SessionObserver Subscription [update]");
      this.sessionObserverSubscription.on("update", async (wrSess) => {
        console.log("On SessionObserver [update]");
        await this.checkForCounterpart(wrSess);
      });
      console.log("Set SessionObserver Subscription [delete]");
      this.sessionObserverSubscription.on("delete", async (wrSess) => {
        console.log("On SessionObserver [delete]");
        // check if own session is taken over by another device
        await this.checkForSessionTakeOver(wrSess);
        // check if counterpart session is deleted
        await this.checkForCounterpart(wrSess);
      });
    },

    /* subscription required for EVENT timekeeper which selects a startnumber
     * MODE_STARTSTOP + MODE_ONLY_STARTTIME + MODE_WIDTH + MODE_POINTS watches for state of start timekeeper
     */
    async subscribeToStartNumberObserver() {
      const query = new Parse.Query(DB.CLASS_EVENT);
      query.equalTo(DB.CLASS_FIELD_OBJECTID, this.user.usertype.eventId);
      query.select([DB.CLASS_ARRAY_REGISTRANTS]);
      this.starterNumberSubscription = this.parseClient.subscribe(query, Parse.User.current().get("sessionToken"));

      this.starterNumberSubscription.on("update", (ev) => {
        this.starters = ev.get(DB.CLASS_ARRAY_REGISTRANTS);
      });
    },

    async initSubscriptions() {
      // init parseClient for LiveQuery
      try {
        const LiveQueryClient = Parse.LiveQueryClient;
        this.parseClient = new LiveQueryClient({
          applicationId: import.meta.env.VITE_APP_PARSE_APP_ID,
          serverURL: import.meta.env.VITE_APP_PARSE_WSS_URL,
          javascriptKey: import.meta.env.VITE_APP__PARSE_JAVASCRIPT_ID,
        });
        this.parseClient.open();
        // required in each case for session take over by another device
        await this.subscribeToSessionObserver();
        // required in each case for watching manual changes of table entries
        await this.subscribeToTimeTableEntries();

        if (this.requireCounterpartSubscription) {
          // counterpart check is required
          await this.checkForCounterpart();
        }
        // additionally the startnumber selection might subscribe to Startnumber changes
        if (this.requiresStartNumberObserver) {
          await this.subscribeToStartNumberObserver();
        }
      } catch (error) {
        console.log("initSubscriptions:error", error);
        throw error;
      }
    },
  },

  getters: {
    getStartNumbers() {
      const stageStartNumbers = this.starters.map((s) => s[DB.REGISTRANT_FIELD_STARTNUMBER]);
      const notOnStageStartNumbers = stageStartNumbers.filter((sn) => !this.starterOnStage[sn]);

      if (this.isPopup) {
        return notOnStageStartNumbers;
      }

      const availableStarters = notOnStageStartNumbers.filter((sn) => {
        const finishedRunsCount = (this.finishedStarter[sn] || []).length;
        const maxTryCount = this.getTryCountMode !== "MIN" ? this.user.usertype.stageMaxTryCount : Infinity;
        return finishedRunsCount < maxTryCount;
      });
      return availableStarters;
    },

    getStartNumbersOnStage() {
      return Object.keys(this.starterOnStage);
    },

    showSelection() {
      return ["MODE_ONLY_STARTTIME", "MODE_STARTSTOP", "MODE_WIDTH", "MODE_POINTS"].includes(this.mode);
    },

    showStartTimer() {
      return ["MODE_ONLY_STARTTIME", "MODE_STARTSTOP"].includes(this.mode) && this.selectedStarter;
    },

    showResetTimer() {
      return ["MODE_ONLY_STARTTIME", "MODE_STARTSTOP"].includes(this.mode) && this.getStartNumbersOnStage.length;
    },

    showStopTime() {
      return ["MODE_ONLY_STOPTIME", "MODE_STARTSTOP"].includes(this.mode);
    },

    showValueInput() {
      return ["MODE_WIDTH", "MODE_POINTS"].includes(this.mode);
    },

    showCounterPartWarning() {
      return this.requireCounterpartSubscription && !this.isCounterPartAvailable;
    },

    isPopup() {
      return this.user?.usertype.type === "popup";
    },

    isEvent() {
      return this.user?.usertype.type === "event";
    },

    getTryCountMode() {
      if (this.user.usertype.stageMinTryCount === this.user.usertype.stageMaxTryCount) {
        return "EXACT";
      }
      if (this.user.usertype.stageMaxTryCount === 0) {
        return "MIN";
      }
      return "MINMAX";
    },

    getEventName() {
      if (this.isEvent) {
        return this.user?.usertype.eventName;
      }
      if (this.isPopup) {
        return this.user?.usertype.popupName;
      }
      return "";
    },

    getStageName() {
      if (this.isPopup) {
        return undefined;
      }
      return this.user?.usertype.stageName;
    },

    isStart() {
      return this.user?.usertype.target === "start";
    },

    requireCounterpartSubscription() {
      // "MODE_STARTSTOP" is required for session observer in case another device take over
      return ["MODE_ONLY_STARTTIME", "MODE_ONLY_STOPTIME"].includes(this.mode);
    },

    requiresStartNumberObserver() {
      return this.isEvent && ["MODE_STARTSTOP", "MODE_ONLY_STARTTIME", "MODE_WIDTH", "MODE_POINTS"].includes(this.mode);
    },

    getMaxStartNumber() {
      const popupType = this.user?.usertype?.popupType;

      if (!popupType) return 1;
      if (popupType === "code") return 1000;
      if (popupType === "free5x5") return 5;

      return 1;
    },

    getSessionObserverQuery() {
      if (!this.user) return;
      const queryData = {
        WR_ID: this.user.usertype[this.getUserTypeEvent],
      };
      if (this.user.usertype.type === "event") {
        queryData.StageName = this.user.usertype.stageName;
      }
      const selectedFields = ["Target", "StageName"];
      return this.getQuery({ className: "WR_SESSION_OBSERVER", queryData, selectedFields });
    },

    getUserTypeEvent() {
      let field = DB.USERTYPE_FIELD_EVENTID;
      if (this.user.usertype.type === "popup") {
        field = DB.USERTYPE_FIELD_POPUPID;
      }
      return field;
    },

    getQuery() {
      return ({ className, queryData, selectedFields }) => {
        const query = new Parse.Query(className);
        for (const key in queryData) {
          query.equalTo(key, queryData[key]);
        }
        query.select(selectedFields);
        return query;
      };
    },
  },
});
