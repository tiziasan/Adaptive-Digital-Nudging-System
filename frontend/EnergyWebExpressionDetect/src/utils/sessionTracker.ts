import { Appliance } from "../components/EnergyGlobe/types";
import { EmotionMap } from "../components/EnergyGlobe/EmotionBar"; 

interface Interaction {
  appliance_type: string;
  clicks: number;
  hesitation_ms: number;
  usage_hours_yesterday: number;
  usage_hours_last_week: number;
  appliance_watt_consumption: number;
  chart_interactions?: number;
}

interface SessionData {
  user_id: string;
  session_id: string;
  timestamp: string;
  session_duration_sec: number;
  device: string;
  screen: string;
  electrodomestic_interactions: Interaction[];
  page_scrolls: number;
  user_emotion: EmotionMap | null;
}

const sessionId = `sess_${Math.random().toString(36).slice(2, 10)}`;
const userId = `user_${Math.random().toString(36).slice(2, 10)}`;
const sessionStart = Date.now();

const interactionMap: Record<string, Interaction> = {};
const enterTimestamps: Record<string, number> = {};

let pageScrolls = 0;

export const trackPageScroll = () => {
  pageScrolls++;
};

export const trackClick = (appliance: Appliance) => {
  const key = appliance.name;
  if (!interactionMap[key]) initializeInteraction(appliance);
  interactionMap[key].clicks++;
  if (enterTimestamps[key]) {
    interactionMap[key].hesitation_ms += Date.now() - enterTimestamps[key];
    delete enterTimestamps[key];
  }
};

export const trackMouseEnter = (appliance: Appliance) => {
  const key = appliance.name;
  if (!interactionMap[key]) initializeInteraction(appliance);
  enterTimestamps[key] = Date.now();
};

export const trackInitial = (appliance: Appliance) => {
  const key = appliance.name;
  if (!interactionMap[key]) initializeInteraction(appliance);
};

export const trackChartInteraction = (applianceName: string) => {
  if (!interactionMap[applianceName]) return;
  interactionMap[applianceName].chart_interactions =
    (interactionMap[applianceName].chart_interactions ?? 0) + 1;
};

const initializeInteraction = (appliance: Appliance) => {
  interactionMap[appliance.name] = {
    appliance_type: appliance.name,
    clicks: 0,
    hesitation_ms: 0,
    usage_hours_yesterday: appliance.hoursPerDay,
    usage_hours_last_week: appliance.hoursPerDay * 7,
    appliance_watt_consumption: appliance.watts,
  };
};

export const exportSessionData = (user_emotion: EmotionMap | null): SessionData => {
  const session_duration_sec = (Date.now() - sessionStart) / 1000;
  return {
    user_id: userId,
    session_id: sessionId,
    timestamp: new Date(sessionStart).toISOString(),
    session_duration_sec,
    device: navigator.userAgent,
    screen: `${window.innerWidth}x${window.innerHeight}`,
    electrodomestic_interactions: Object.values(interactionMap),
    page_scrolls: pageScrolls,
    user_emotion,
  };
};
