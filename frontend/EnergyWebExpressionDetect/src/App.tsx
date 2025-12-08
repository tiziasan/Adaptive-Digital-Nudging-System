import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Consent from "./components/Consent";
import EnergyGlobe from "./components/EnergyGlobe/EnergyGlobe";
import { useUserEmotion } from "./hooks/useUserEmotion";
import { UIProvider } from "./context/UIContext";


const defaultUIState = {
    font_size: "20px",
    background_color: "#ffffff",
    primary_color: "#EEEEEE",
    secondary_color: "#000000",
    consumption_graph: "pie",
    price_graph: "pie"
};

export default function App() {
    const [hasConsented, setHasConsented] = useState(false);
    const { emotion, videoRef } = useUserEmotion(hasConsented);

    return (
        <BrowserRouter>
            {hasConsented && (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    style={{
                        width: 1,
                        height: 1,
                        opacity: 0,
                        position: "fixed",
                        pointerEvents: "none",
                        zIndex: -1
                    }}
                />
            )}

            <UIProvider currentUIState={defaultUIState}>
                <Routes>
                    <Route
                        path="/consent"
                        element={<Consent onConsent={() => setHasConsented(true)} />}
                    />

                    <Route
                        path="/dashboard"
                        element={
                            hasConsented ? (
                                <EnergyGlobe userEmotion={emotion} />
                            ) : (
                                <Navigate to="/consent" replace />
                            )
                        }
                    />

                    <Route path="*" element={<Navigate to="/consent" replace />} />
                </Routes>
            </UIProvider>
        </BrowserRouter>
    );
}