import React, { createContext, useContext, useState, useEffect } from "react";

interface UIContextType {
    uiState: any;
    setUIState: React.Dispatch<React.SetStateAction<any>>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
};

export const UIProvider: React.FC<{ children: React.ReactNode; currentUIState: any }> = ({
                                                                                             children,
                                                                                             currentUIState,
                                                                                         }) => {
    const [uiState, setUIState] = useState(currentUIState);


    useEffect(() => {
        setUIState(currentUIState);
    }, [currentUIState]);

    return <UIContext.Provider value={{ uiState, setUIState }}>{children}</UIContext.Provider>;
};