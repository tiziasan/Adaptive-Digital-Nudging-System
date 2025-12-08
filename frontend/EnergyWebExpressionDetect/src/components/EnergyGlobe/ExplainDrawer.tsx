import React, { useState, useEffect, useRef } from "react";
import { exportSessionData } from "../../utils/sessionTracker";
import type { EmotionMap, Nudge } from "./EnergyGlobe";
import { Appliance } from "./types";
import nudgeInsight from "../../data/nudgeInsight.json";
import { useUI } from "../../context/UIContext";

type PreviousNudge = {
    nudge_id: string;
    timestamp: string;
    feedback: "thumbs_up" | "thumbs_down";
    nudge_message?: string;
    nudge_strategy?: string;
};

interface Props {
    onClose: () => void;
    alwaysVisible?: boolean;
    debug?: boolean;

    userEmotion?: EmotionMap | null;
    previousNudges: PreviousNudge[];
    currentNudge: Nudge;
    currentStrategyKey?: string;

    appliances: Appliance[];
    pricePerKWh: number;

    onFeedback: (
        feedback: "thumbs_up" | "thumbs_down",
        message?: string,
        strategy?: string
    ) => void;

    onRotateSuggestion: () => void;
    onClearHistory: () => void;
}

export default function ExplainDrawer({
                                          onClose,
                                          alwaysVisible = false,
                                          debug = false,
                                          userEmotion,
                                          previousNudges,
                                          currentNudge,
                                          currentStrategyKey,
                                          appliances,
                                          pricePerKWh,
                                          onFeedback,
                                          onRotateSuggestion,
                                          onClearHistory,
                                      }: Props) {
    const defaultExplanation = nudgeInsight?.user_modeling || {};
    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [generatedNudge, setGeneratedNudge] = useState<string | null>(null);
    const [aiResult, setAiResult] = useState<any>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [hasRecorded, setHasRecorded] = useState(false);

    const { setUIState } = useUI();

    const emotionRef = useRef(userEmotion);

    useEffect(() => {
        emotionRef.current = userEmotion;
    }, [userEmotion]);

    const getDominantEmotion = (emotions: EmotionMap | null | undefined): string => {
        if (!emotions) return "neutral";
        const entries = Object.entries(emotions);
        if (entries.length === 0) return "neutral";
        entries.sort((a, b) => b[1] - a[1]);
        return entries[0][0];
    };

    const getHappyScore = (emotions: EmotionMap | null | undefined): number => {
        if (!emotions) return 0.0;
        return typeof emotions.happy === 'number' ? emotions.happy : 0.0;
    };

    const recordOutcome = async (currentSessionId: string) => {
        const currentEmotions = emotionRef.current;

        console.log("📸 Capturing Post-Nudge Emotions:", currentEmotions);

        const currentEmotion = getDominantEmotion(currentEmotions);
        const currentHappyScore = getHappyScore(currentEmotions);

        console.log(`📡 Sending Post-Nudge: ${currentEmotion} (Happy: ${currentHappyScore}) for Session: ${currentSessionId}`);

        try {
            await fetch("http://localhost:8000/api/record-outcome", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: currentSessionId,
                    post_nudge_emotion: currentEmotion,
                    post_nudge_happy_score: currentHappyScore
                }),
            });
            console.log("✅ Outcome recorded successfully in CSV");
        } catch (error) {
            console.error("❌ Failed to record outcome:", error);
        }
    };

    useEffect(() => {
        if (generatedNudge && sessionId && !hasRecorded) {
            console.log("⏳ Nudge displayed. Waiting 3s to capture reaction...");

            const timer = setTimeout(() => {
                recordOutcome(sessionId);
                setHasRecorded(true); // Mark as done so we don't double-record
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [generatedNudge, sessionId, hasRecorded]);

    const flashFeedback = () => {
        setFeedbackMsg("Feedback received ✅");
        setTimeout(() => setFeedbackMsg(null), 1500);
    };

    const handleFeedbackClick = (type: "thumbs_up" | "thumbs_down") => {
        if (generatedNudge) {
            const strategy = aiResult?.nudge_intelligence?.selected_strategy || "AI Generated";
            onFeedback(type, generatedNudge, strategy);

            if (sessionId && !hasRecorded) {
                recordOutcome(sessionId);
                setHasRecorded(true);
            }
        } else {
            onFeedback(type, currentNudge.message, currentStrategyKey || "Rule Based");
        }
        flashFeedback();
    };

    const handleExport = async () => {
        setIsProcessing(true);
        setGeneratedNudge(null);
        setAiResult(null);
        setSessionId(null);
        setHasRecorded(false); // Reset recording state for new generation

        try {
            const sessionBase =
                (exportSessionData as any)?.length >= 1
                    ? (exportSessionData as any)(userEmotion ?? null)
                    : (exportSessionData as any)();

            const liveInteractions = appliances.map((app) => ({
                appliance_type: app.name,
                clicks: (app as any).clicks || 0,
                hesitation_ms: 0,
                usage_hours_yesterday: app.on ? app.hoursPerDay : 0,
                usage_hours_last_week: app.on ? (app.hoursPerDay * 7) : 0,
                appliance_watt_consumption: app.watts
            }));

            const payload = {
                ...sessionBase,
                electrodomestic_interactions: liveInteractions,
                current_price: pricePerKWh,
                nudge_id: currentNudge.nudge_id,
                previous_nudges: previousNudges,
                user_emotion: userEmotion ?? null,
                timestamp: new Date().toISOString(),
            };

            console.log("Sending data to Python backend...", payload);

            const response = await fetch("http://localhost:8000/api/run-pipeline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

            const result = await response.json();
            const pipelineData = result.data;

            if (pipelineData?.session_id) {
                setSessionId(pipelineData.session_id);
            }

            const uiData = pipelineData?.ui_adaptation;

            if (uiData && setUIState) {
                setUIState((prevState: any) => ({
                    ...prevState,
                    background_color: uiData.background_colour || uiData.background_color || prevState.background_color,
                    primary_color: uiData.primary_colour || uiData.primary_color || prevState.primary_color,
                    secondary_color: uiData.secondary_colour || uiData.secondary_color || prevState.secondary_color,
                    font_size: uiData.font_size || prevState.font_size,
                    consumption_graph: uiData.consumption_graph || prevState.consumption_graph,
                    price_graph: uiData.price_graph || prevState.price_graph
                }));
                setFeedbackMsg("UI Adapted to your profile! 🎨");
            }

            const pythonNudge = pipelineData?.nudge_intelligence?.nudge_message;

            if (pythonNudge) {
                setGeneratedNudge(pythonNudge);
                setAiResult(pipelineData);
                if (!uiData) setFeedbackMsg("New AI Nudge Generated! ✨");
            } else {
                if (!uiData) setFeedbackMsg("Pipeline finished.");
            }
            setTimeout(() => setFeedbackMsg(null), 3000);

        } catch (error) {
            console.error("Error connecting to backend:", error);
            setFeedbackMsg("Error connecting to server ❌");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div
                className={`h-full w-full bg-white border-l shadow-inner p-4 text-sm space-y-3 ${
                    alwaysVisible
                        ? "block"
                        : "fixed right-0 top-0 h-full w-96 z-50 overflow-y-auto"
                }`}
            >
                {!alwaysVisible && (
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-semibold">Suggestions</h2>
                        <button onClick={onClose} className="text-gray-600 hover:text-black">✕</button>
                    </div>
                )}

                {alwaysVisible && (
                    <>
                        <h2 className="text-lg font-semibold">Suggestions</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            <strong>How it works</strong><br />
                            Based on your current appliance layout and energy patterns, we provide a suggested optimization below.
                        </p>
                    </>
                )}

                <hr className="my-2" />

                {debug && (
                    <>
                        <p><strong>Cognitive Mode:</strong> {(defaultExplanation as any).cognitive_mode}</p>
                        <hr className="my-2" />
                    </>
                )}

                {generatedNudge ? (
                    <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded animate-pulse-once">
                        <div className="flex justify-between items-center mb-1">
                            <strong className="text-purple-700">AI Generated Action:</strong>
                            <span className="text-[10px] bg-purple-200 text-purple-800 px-1 rounded">NEW</span>
                        </div>
                        <div className="text-gray-800 italic">"{generatedNudge}"</div>
                    </div>
                ) : (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <strong>Suggested Action:</strong>
                        <div>{currentNudge.message}</div>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => handleFeedbackClick("thumbs_up")}
                        className="text-sm px-3 py-1 bg-green-100 rounded hover:bg-green-200"
                    >
                        👍 Helpful
                    </button>
                    <button
                        onClick={() => handleFeedbackClick("thumbs_down")}
                        className="text-sm px-3 py-1 bg-red-100 rounded hover:bg-red-200"
                    >
                        👎 Not helpful
                    </button>
                    {previousNudges.length > 0 && (
                        <button
                            onClick={onClearHistory}
                            className="text-xs px-2 py-1 text-gray-500 hover:text-red-600 underline ml-auto"
                        >
                            Clear History ({previousNudges.length})
                        </button>
                    )}
                </div>

                {feedbackMsg && (
                    <div className={`text-xs border rounded px-2 py-1 ${
                        feedbackMsg.includes("Error")
                            ? "text-red-700 bg-red-50 border-red-200"
                            : "text-green-700 bg-green-50 border-green-200"
                    }`}>
                        {feedbackMsg}
                    </div>
                )}

                <hr className="my-3" />

                <div className="space-y-3">
                    <button
                        onClick={handleExport}
                        disabled={isProcessing}
                        className={`text-sm px-3 py-2 rounded transition-colors w-full font-medium ${
                            isProcessing
                                ? "bg-gray-300 cursor-not-allowed text-gray-600"
                                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm"
                        }`}
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            "GENERATE AI NUDGE ⚡"
                        )}
                    </button>

                    {generatedNudge && aiResult && (
                        <button
                            onClick={() => setShowExplanation(true)}
                            className="text-sm px-3 py-2 rounded transition-colors w-full font-medium border border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            Explain the nudge
                        </button>
                    )}
                </div>
            </div>

            {showExplanation && aiResult && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                🤖 AI Reasoning Engine
                            </h3>
                            <button onClick={() => setShowExplanation(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-sm uppercase tracking-wide text-gray-500 font-bold border-b pb-1">User Modeling</h4>
                                <div className="grid gap-4">
                                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="font-semibold text-gray-700">Cognitive Mode</span>
                                            <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                {aiResult.user_modeling?.cognitive_mode}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm italic">"{aiResult.user_modeling?.cognitive_mode_reasoning}"</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="font-semibold text-gray-700">Behavioral Stage</span>
                                            <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                {aiResult.user_modeling?.behavioral_stage}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm italic">"{aiResult.user_modeling?.behavioral_stage_reasoning}"</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="font-semibold text-gray-700">Attention Capacity</span>
                                            <span className="text-xs font-mono bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                                {aiResult.user_modeling?.attention_availability}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm italic">"{aiResult.user_modeling?.attention_availability_reasoning}"</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm uppercase tracking-wide text-gray-500 font-bold border-b pb-1">Nudge Strategy</h4>
                                <div className="bg-purple-50 p-4 rounded border border-purple-100">
                                    <div className="mb-2">
                                        <span className="font-semibold text-gray-700 block mb-1">Selected Strategy</span>
                                        <span className="text-sm font-medium text-purple-700">{aiResult.nudge_intelligence?.selected_strategy}</span>
                                    </div>
                                    <div className="mt-3">
                                        <span className="font-semibold text-gray-700 block mb-1">Why this strategy?</span>
                                        <p className="text-gray-600 text-sm italic">"{aiResult.nudge_intelligence?.strategy_selection_reasoning}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <button onClick={() => setShowExplanation(false)} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors text-sm">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}