// URL of the server (atm. localhost Uvicorn)
const BASE_URL = import.meta.env.DEV ? "http://localhost:8000" : "";

// New single API call: Send EmotionMap, PreviousRound, and UserID - get adaptation back
export const requestAdaptationAndEvaluation = async (emotionMap, previousRound, userID) => {
  try {
    // If no previous round exists (first request), create a default/dummy previous round
    let actualPreviousRound = previousRound;
    if (!previousRound) {
      const currentTime = new Date();
      const startTime = new Date(currentTime.getTime() - 3000); // 3 seconds ago for initial window
      
      // Use the specified time formats
      const timeString = `${currentTime.getHours().toString().padStart(2, '0')}.${currentTime.getMinutes().toString().padStart(2, '0')}.${currentTime.getSeconds().toString().padStart(2, '0')}`;
      const startTimeString = `${startTime.getHours().toString().padStart(2, '0')}.${startTime.getMinutes().toString().padStart(2, '0')}.${startTime.getSeconds().toString().padStart(2, '0')}`;
      const adaptationTimeString = `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, '0')}-${currentTime.getDate().toString().padStart(2, '0')} ${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`;
      
      actualPreviousRound = {
        EmotionMap: {
          angry: 0.0,
          disgusted: 0.0,
          fearful: 0.0,
          happy: 0.0,
          neutral: 1.0, // Start with neutral emotion
          sad: 0.0,
          surprised: 0.0
        },
        TimesliceStart: startTimeString, // 3 seconds ago - start of initial window  
        TimesliceEnd: timeString, // Now - end of initial window
        PreAdaptUIState: {
          font_size: "16px",
          background_color: "#ffffff",
          primary_color: "#047857",
          secondary_color: "#10b981",
          consumption_graph: "bar",
          price_graph: "line",
          emotion: "neutral",
          activeScreen: "dashboard"
        },
        AdaptationTime: adaptationTimeString, // Real timestamp
        Adaptation: { "font_size": "16px" } // Initial adaptation
      };
    }
    
    const payload = { 
      EmotionMap: emotionMap,
      PreviousRound: actualPreviousRound,
      UserID: userID
    };
    
    const response = await fetch(`${BASE_URL}/request_adaptation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok){
      const errorText = await response.text();
      console.error("API: Adaptation request failed:", response.status, errorText);
      return null;
    }
    
    // Await response (adaptation)
    const data = await response.json();
    return { adaptation: data.adaptation };
  } catch (error) {
    console.error("API: Error requesting adaptation and evaluation:", error);
    return null;
  }
};

// Legacy API calls (keeping for backward compatibility during transition)

// API call 1: current (initial) UI state
export const requestAdaptation = async (uiState) => {
  try {
    const { userID, ...uiStateWithoutID } = uiState;
    const response = await fetch(`${BASE_URL}/request_adaptation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: uiStateWithoutID, userID }),
    });

    if (!response.ok){
      console.log("Failed to request adaptation");
    }
    // Await response (adaptation)
    const data = await response.json();
    /* will take the form:
    {
      "adaptation": {"font_size": "19px"},
      "action_number": 6
    }
    */
    return { adaptation: data.adaptation, action_number: data.action_number };
  } catch (error) {
    console.error("Error requesting adaptation:", error);
    return null;
  }
};

// API call 2: Send initial UIState, action_number and resulting UIState after evaluating adaptation
export const sendAdaptationEvaluation = async (initState, action_number, newState) => {
  try {
    const { userID: initUserID, ...cleanInitState } = initState;
    const { userID: newUserID, ...cleanNewState } = newState;
    const userID = initUserID || newUserID;
    const response = await fetch(`${BASE_URL}/review_adaptation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({init_state: cleanInitState, action: action_number, new_state: cleanNewState, userID}),
    }); // API call 3 send-off

    if (!response.ok){
      console.log("Failed to send adaptation evaluation");
    }
    const data = await response.json();
    return {message: data.message}; // should be {"Back-end status": "Q-table updated"}

  } catch (error) {
    console.error("Error sending adaptation evaluation:", error);
  }
};

// Feedback submission API call
export const submitFeedback = async (feedbackData) => {
  try {
    const response = await fetch(`${BASE_URL}/submit_feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      console.error("Failed to submit feedback");
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return null;
  }
};
