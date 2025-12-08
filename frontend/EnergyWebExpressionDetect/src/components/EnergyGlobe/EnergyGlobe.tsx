import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { Appliance } from "./types";
import ApplianceCanvas from "./ApplianceCanvas";
import ControlsPanel from "./ControlsPanel";
import AppliancePalette from "./AppliancePalette";
import ExplainDrawer from "./ExplainDrawer";
import ChartsSection from "./ChartsSection";
import { useUI } from "../../context/UIContext";

export type EmotionMap = {
    angry: number;
    disgusted: number;
    fearful: number;
    happy: number;
    neutral: number;
    sad: number;
    surprised: number;
};

export type PreviousNudge = {
    nudge_id: string;
    timestamp: string;
    feedback: "thumbs_up" | "thumbs_down";
    nudge_message?: string;
    nudge_strategy?: string;
};

export type Nudge = {
    nudge_id: string;
    strategy_key: string;
    message: string;
};

type Props = {
    userEmotion?: EmotionMap | null;
};

// 1. ADD CLICKS INITIALIZATION
const defaultAppliances: Appliance[] = [
    { id: uuidv4(), name: "Fridge", watts: 120, x: 20, y: 30, icon: "❄️", on: true, hoursPerDay: 24, clicks: 0 },
    { id: uuidv4(), name: "Oven", watts: 2400, x: 30, y: 60, icon: "🔥", on: true, hoursPerDay: 0.5, clicks: 0 },
    { id: uuidv4(), name: "TV", watts: 90, x: 62, y: 48, icon: "📹", on: true, hoursPerDay: 3, clicks: 0 },
    { id: uuidv4(), name: "Laptop", watts: 65, x: 70, y: 55, icon: "💻", on: true, hoursPerDay: 4, clicks: 0 },
    { id: uuidv4(), name: "Heater", watts: 2000, x: 80, y: 26, icon: "🔥", on: true, hoursPerDay: 5, clicks: 0 },
    { id: uuidv4(), name: "Washer", watts: 700, x: 44, y: 82, icon: "🛎️", on: true, hoursPerDay: 1, clicks: 0 },
    { id: uuidv4(), name: "AC", watts: 850, x: 82, y: 20, icon: "🌬️", on: true, hoursPerDay: 8, clicks: 0 },
];

type StrategyCtx = {
    appliances: Appliance[];
    pricePerKWh: number;
};

type Strategy = {
    key: string;
    build: (ctx: StrategyCtx) => Nudge | null;
};

const UNSAFE_TO_REDUCE = [
    "Fridge",
    "Freezer",
    "Router",
    "Modem",
    "Smoke Alarm"
];

const reducible = (a: Appliance) => a.on && !UNSAFE_TO_REDUCE.includes(a.name);

const kwhPerDay = (a: Appliance) => (a.watts / 1000) * a.hoursPerDay;

const STRATEGIES: Strategy[] = [
    {
        key: "top_reducible_consumer_reduce_1h",
        build: ({ appliances, pricePerKWh }) => {
            const candidates = appliances.filter(reducible);
            if (!candidates.length) return null;

            const withKwh = candidates.map((a) => ({
                ...a,
                kwhDay: kwhPerDay(a),
            }));

            const top = withKwh.reduce((m, a) => (a.kwhDay > m.kwhDay ? a : m));

            const savedKwhWeek = (top.watts / 1000) * 1 * 7;
            const weeklySavings = savedKwhWeek * pricePerKWh;

            if (weeklySavings < 2) return null;

            return {
                nudge_id: `nudge_top_${top.name}_${Date.now()}`,
                strategy_key: "top_reducible_consumer_reduce_1h",
                message:
                    `${top.name} is your highest reducible consumer at ${top.kwhDay.toFixed(1)} kWh/day. ` +
                    `Cutting about 1 hour/day could save roughly ${weeklySavings.toFixed(2)} kr per week.`,
            };
        },
    },

    {
        key: "ac_heater_temperature_tune",
        build: ({ appliances, pricePerKWh }) => {
            const target = appliances.find(
                (a) =>
                    a.on &&
                    (a.name.toLowerCase().includes("ac") ||
                        a.name.toLowerCase().includes("air conditioner") ||
                        a.name.toLowerCase().includes("heater"))
            );
            if (!target) return null;

            const weeklyUse = kwhPerDay(target) * 7;
            const weeklySavings = weeklyUse * 0.10 * pricePerKWh;

            if (weeklySavings < 2) return null;

            const isHeater = target.name.toLowerCase().includes("heat");

            return {
                nudge_id: `nudge_temp_${target.name}_${Date.now()}`,
                strategy_key: "ac_heater_temperature_tune",
                message:
                    `${target.name} runs ~${target.hoursPerDay.toFixed(1)} hrs/day. ` +
                    `A small thermostat tweak (${isHeater ? "lowering" : "raising"} by ~1–2°C) can cut energy use ~10%. ` +
                    `That’s about ${weeklySavings.toFixed(2)} kr per week.`,
            };
        },
    },

    {
        key: "eco_mode_high_impact",
        build: ({ appliances, pricePerKWh }) => {
            const ecoCandidates = appliances.filter(
                (a) =>
                    reducible(a) &&
                    /(washer|dryer|dishwasher|ac|air conditioner|heater|oven)/i.test(a.name)
            );
            if (!ecoCandidates.length) return null;

            const withKwh = ecoCandidates.map((a) => ({
                ...a,
                kwhDay: kwhPerDay(a),
            }));

            const top = withKwh.reduce((m, a) => (a.kwhDay > m.kwhDay ? a : m));

            const weeklyUse = top.kwhDay * 7;
            const weeklySavings = weeklyUse * 0.15 * pricePerKWh;

            if (weeklySavings < 2) return null;

            return {
                nudge_id: `nudge_eco_${top.name}_${Date.now()}`,
                strategy_key: "eco_mode_high_impact",
                message:
                    `${top.name} is a significant energy user. If it has an Eco/Power-saving mode, enabling it typically saves ~10–20%. ` +
                    `At your current use that’s around ${weeklySavings.toFixed(2)} kr per week.`,
            };
        },
    },

    {
        key: "high_wattage_batching",
        build: ({ appliances, pricePerKWh }) => {
            const highWatt = appliances.filter(
                (a) =>
                    reducible(a) &&
                    a.watts >= 1500 &&
                    /(oven|dryer|heater|ac|air conditioner)/i.test(a.name)
            );
            if (!highWatt.length) return null;

            const target = highWatt.reduce((m, a) => (a.watts > m.watts ? a : m));

            const weeklyUse = kwhPerDay(target) * 7;
            const weeklySavings = weeklyUse * 0.08 * pricePerKWh;

            if (weeklySavings < 2) return null;

            return {
                nudge_id: `nudge_batch_${target.name}_${Date.now()}`,
                strategy_key: "high_wattage_batching",
                message:
                    `${target.name} draws high power (${target.watts} W). ` +
                    `Batching use (fewer start-ups / shorter warmups) can save ~5–10%. ` +
                    `That’s roughly ${weeklySavings.toFixed(2)} kr per week.`,
            };
        },
    },

    {
        key: "standby_idle_off",
        build: ({ appliances, pricePerKWh }) => {
            const standbyCandidates = appliances.filter(
                (a) =>
                    reducible(a) &&
                    a.watts <= 150 &&
                    /(tv|laptop|pc|console|monitor|charger|speaker|lamp)/i.test(a.name)
            );
            if (!standbyCandidates.length) return null;

            const target = standbyCandidates.reduce((m, a) =>
                kwhPerDay(a) > kwhPerDay(m) ? a : m
            );

            const weeklySavings = kwhPerDay(target) * 7 * 0.20 * pricePerKWh;

            if (weeklySavings < 1) return null;

            return {
                nudge_id: `nudge_standby_${target.name}_${Date.now()}`,
                strategy_key: "standby_idle_off",
                message:
                    `${target.name} is often left on/idle. Fully turning it off when not in use can cut ~20% of its energy. ` +
                    `That’s about ${weeklySavings.toFixed(2)} kr per week.`,
            };
        },
    },
];

function generateNudge(
    appliances: Appliance[],
    pricePerKWh: number,
    strategyIndex: number
): Nudge {
    const ctx = { appliances, pricePerKWh };
    const start = strategyIndex % STRATEGIES.length;

    for (let offset = 0; offset < STRATEGIES.length; offset++) {
        const strat = STRATEGIES[(start + offset) % STRATEGIES.length];
        const nudge = strat.build(ctx);
        if (nudge) return nudge;
    }

    return {
        nudge_id: `nudge_fallback_${Date.now()}`,
        strategy_key: "fallback",
        message:
            "Focus on your highest-use non-essential appliances. Small reductions there usually give the biggest savings.",
    };
}

export default function EnergyGlobe({ userEmotion }: Props) {
    const [appliances, setAppliances] = useState<Appliance[]>(defaultAppliances);
    const [pricePerKWh, setPricePerKWh] = useState(0.35);
    const [scene, setScene] = useState<"floor" | "room3d">("floor");

    const { uiState } = useUI();

    const [previousNudges, setPreviousNudges] = useState<PreviousNudge[]>(() => {
        try {
            const saved = localStorage.getItem("previous_nudges");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [strategyIndex, setStrategyIndex] = useState(0);

    const [currentNudge, setCurrentNudge] = useState<Nudge>(() =>
        generateNudge(defaultAppliances, pricePerKWh, 0)
    );

    useEffect(() => {
        setCurrentNudge(generateNudge(appliances, pricePerKWh, strategyIndex));
    }, [appliances, pricePerKWh, strategyIndex]);

    useEffect(() => {
        console.log("🎨 EnergyGlobe UI Context Color:", uiState.background_color);
    }, [uiState.background_color]);

    // 2. CLICK TRACKER HANDLER
    function handleApplianceClick(id: string) {
        setAppliances(prev => prev.map(app => {
            if (app.id === id) {
                const newClicks = (app.clicks || 0) + 1;
                console.log(`🖱️ Clicked ${app.name}: ${newClicks}`);
                return { ...app, clicks: newClicks };
            }
            return app;
        }));
    }

    function recordNudgeFeedback(
        feedback: "thumbs_up" | "thumbs_down",
        nudgeMessage?: string,
        nudgeStrategy?: string
    ) {
        // Use provided values (AI nudge) or fallback to current rule-based nudge
        const messageToSave = nudgeMessage || currentNudge.message;
        const strategyToSave = nudgeStrategy || currentNudge.strategy_key;

        // Use a distinct ID if it's an AI nudge (to prevent ID collisions with rules)
        const idToSave = nudgeMessage ? `ai_nudge_${Date.now()}` : currentNudge.nudge_id;

        const entry: PreviousNudge = {
            nudge_id: idToSave,
            timestamp: new Date().toISOString(),
            feedback,
            nudge_message: messageToSave,
            nudge_strategy: strategyToSave
        };

        setPreviousNudges((prev) => {
            // Keep last 20 entries
            const next = [...prev, entry].slice(-20);
            localStorage.setItem("previous_nudges", JSON.stringify(next));
            return next;
        });

        console.log("📝 Saved feedback:", entry);
    }

    const totalKWh = useMemo(() => {
        return appliances
            .filter((a) => a.on)
            .reduce((sum, a) => sum + (a.watts / 1000) * a.hoursPerDay, 0);
    }, [appliances]);

    const totalCost = totalKWh * pricePerKWh;
    function clearHistory() {
        localStorage.removeItem("previous_nudges");
        setPreviousNudges([]);
        console.log("🗑️ History cleared");
    }



    return (
        <div
            className="min-h-screen p-4 transition-colors duration-500 ease-in-out"
            style={{
                backgroundColor: uiState.background_color,
                color: uiState.background_color === "#000000" || uiState.background_color === "#666966" ? "white" : "#111827",
                fontSize: uiState.font_size
            }}
        >
            <div className="grid grid-cols-8 gap-6">
                <div className="col-span-7 space-y-4">
                    <ControlsPanel
                        pricePerKWh={pricePerKWh}
                        setPricePerKWh={setPricePerKWh}
                        totalW={0}
                        totalKWh={totalKWh}
                        totalCost={totalCost}
                        appliances={appliances}
                        setAppliances={setAppliances}
                    />

                    {/* 3. PASS CLICK HANDLER */}
                    <ApplianceCanvas
                        appliances={appliances}
                        setAppliances={setAppliances}
                        scene={scene}
                        setScene={setScene}
                        pricePerKWh={pricePerKWh}
                        // @ts-ignore - Ensure ApplianceCanvas has updated Props definition
                        onApplianceClick={handleApplianceClick}
                    />

                    <div className="flex justify-center my-6">
                        <AppliancePalette />
                    </div>

                    <ChartsSection appliances={appliances} pricePerKWh={pricePerKWh} />
                </div>

                <div className="col-span-1">
                    <ExplainDrawer
                        onClose={() => {}}
                        alwaysVisible
                        userEmotion={userEmotion ?? null}
                        previousNudges={previousNudges}
                        currentNudge={currentNudge}
                        currentStrategyKey={
                            STRATEGIES[strategyIndex % STRATEGIES.length]?.key
                        }
                        appliances={appliances}
                        pricePerKWh={pricePerKWh}
                        onFeedback={recordNudgeFeedback}
                        onClearHistory={clearHistory}
                        onRotateSuggestion={() =>
                            setStrategyIndex((i) => (i + 1) % STRATEGIES.length)
                        }
                    />
                </div>
            </div>
        </div>
    );
}