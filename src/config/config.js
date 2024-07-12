const RESULTKEEPING_MAP = {
  MODE_ONLY_STARTTIME: {
    title: "Start",
    modeDropDown: "Zeit (Start und Stop separat)",
    showSelection: true,
    showStartTimer: true,
    showResetTimer: true,
    requireCounterpartSubscription: true,
    requiresStartNumberObserver: true,
  },
  MODE_ONLY_STOPTIME: { title: "Ziel", showStopTimer: true, requireCounterpartSubscription: true },
  MODE_STARTSTOP: {
    title: "Rundkurs",
    modeDropDown: "Zeit (Start und Stop zusammen [Rundkurs] )",
    showSelection: true,
    showStartTimer: true,
    showResetTimer: true,
    showStopTimer: true,
    requiresStartNumberObserver: true,
  },
  MODE_WIDTH: {
    title: "Eingabe Weite",
    modeDropDown: "Weite",
    showSelection: true,
    isResultKeeping: true,
    requiresStartNumberObserver: true,
  },
  MODE_POINTS: {
    title: "Eingabe Punkte",
    modeDropDown: "Punkte",
    showSelection: true,
    isResultKeeping: true,
    requiresStartNumberObserver: true,
  },
};

const DB = {
  QUERY_LIMIT: 1000,
  CLASS_EVENT: "WR_EVENT",
  CLASS_EVENT_TIMETABLE: "WR_EVENT_TIMETABLE",
  CLASS_POPUP: "WR_POPUP",
  CLASS_POPUP_TIMETABLE: "WR_POPUP_TIMETABLE",
  CLASS_ARRAY_REGISTRANTS: "Participants",
  CLASS_FIELD_STARTNUMBER: "StartNumber",
  CLASS_FIELD_STARTTIME: "StartTime",
  CLASS_FIELD_FINISHTIME: "FinishTime",
  CLASS_FIELD_RESULT: "Result",
  CLASS_FIELD_STAGE: "Stage",
  CLASS_FIELD_EVENTID: "EventId",
  CLASS_FIELD_POPUPID: "PopupId",
  CLASS_FIELD_OBJECTID: "objectId",
  REGISTRANT_FIELD_STARTNUMBER: "startNumber",
  USERTYPE_FIELD_EVENTID: "eventId",
  USERTYPE_FIELD_POPUPID: "popupId",
};

const DEV_DEFAULT_MAIL = import.meta.env.DEV ? import.meta.env.VITE_DEV_MAIL : "";
const DEV_DEFAULT_POPUPNAME = import.meta.env.DEV ? import.meta.env.VITE_DEV_POPUPNAME : "";

export { RESULTKEEPING_MAP, DB, DEV_DEFAULT_MAIL, DEV_DEFAULT_POPUPNAME };
