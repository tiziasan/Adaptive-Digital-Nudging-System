import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { submitFeedback } from "../utils/api";

type Step = {
  key: string;
  label: string;
  type?: "slider" | "text" | "radio" | "checkbox";
  options?: string[];
  maxSelections?: number;
  minLabel?: string;
  maxLabel?: string;
  required?: boolean;
};

const tooltipImageMap: Record<string, string> = {
  "Total energy consumption number": "/ui-previews/ConsumptionOverview.png",
  "The changing charts": "/ui-previews/EnergySourceBarChart.png",
  "Energy price section": "/ui-previews/EnergyPrices.png",
  "More facts section": "/ui-previews/FunFactUI.png",
};

const TooltipPreview = ({ src }: { src: string }) => (
  <div className="absolute z-50 w-64 p-1 bg-white border rounded-lg shadow-lg">
    <img src={src} alt="UI Preview" className="rounded" />
  </div>
);


const steps: Step[] = [
  {
    key: "satisfaction",
    label: "How satisfied are you with the adaptive UI experience?",
    type: "slider",
    minLabel: "Very Dissatisfied",
    maxLabel: "Very Satisfied",
  },
  {
    key: "easeOfUse",
    label: "How easy was it to use the dashboard and price tabs?",
    type: "slider",
    minLabel: "Very Difficult",
    maxLabel: "Very Easy",
  },
  {
    key: "awareness",
    label: "Did the screens make you more aware of your energy usage?",
    type: "radio",
    options: ["Not at all", "A little", "Somewhat", "A lot", "Definitely"],
  },
  {
    key: "attention",
    label: "Which screens caught your attention the most?",
    type: "radio",
    options: [
      "Total energy consumption number",
      "The changing charts",
      "Energy price section",
      "More facts section",
      "I didn’t really notice anything",
    ],
  },
  {
    key: "learned",
    label: "Did you learn something new about energy or devices today?",
    type: "radio",
    options: ["Yes", "Maybe", "No"],
  },
  /*{
    key: "learned_what",
    label: "If yes, what did you learn?",
    type: "text",
  },*/
  {
    key: "feelings",
    label: "How did the screens make you feel?",
    type: "checkbox",
    options: [
      "Curious",
      "Surprised",
      "Motivated",
      "Indifferent",
      "Confused",
      "Entertained",
      "Guilty",
      "Proud",
    ],
  },
  {
    key: "habitChange",
    label: "Would you consider changing any of these habits?",
    type: "checkbox",
    options: [
      "Turning off unused devices",
      "Charging at off-peak times",
      "Using fewer tabs/apps/devices",
      "Unplugging overnight chargers",
      "None of these",
    ],
  },
  {
    key: "clarity",
    label: "How clear was the information?",
    type: "radio",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    key: "interaction",
    label: "Did you interact with the screens in any way?",
    type: "checkbox",
    options: [
      "No",
      "I read the trivia/facts",
      "I waited to see a visual change",
      "Other",
    ],
  },
  {
    key: "preferredContent",
    label: "What type of content would you like to see more of? (Choose up to 2)",
    type: "checkbox",
    maxSelections: 2,
    options: [
      "Personal usage comparisons",
      "Device-specific advice",
      "More fun or humorous content",
      "Global energy impact info",
      "Simple 'what to do next' tips",
    ],
  },
  {
    key: "askScreen",
    label: "If you could ask the screen one question about energy, what would it be?",
    type: "text",
  },
  {
    key: "comments",
    label: "Any suggestions to make this experience better or more interesting?",
    type: "text",
  },
];

const Questionnaire = () => {
  const userID = localStorage.getItem("userID") || (() => {
    const id = uuidv4();
    localStorage.setItem("userID", id);
    return id;
  })();

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    steps.forEach((step) => {
      if (step.type === "slider") {
        initial[step.key] = 3;
      }
    });
    return initial;
  });



  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const current = steps[step];

  const isStepValid = (): boolean => {
  const answer = formData[current.key];
  if (current.type === "text") return true; // text inputs are optional
  if (current.type === "radio") return typeof answer === "string" && answer.length > 0;
  if (current.type === "checkbox") return Array.isArray(answer) && answer.length > 0;
  if (current.type === "slider") return answer >= 1 && answer <= 5;
  return false;
};

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    let newFormData = { ...formData };
    
    if (type === "checkbox" && current.options) {
      const selections = formData[name] || [];
      if (checked) {
        if (
          !current.maxSelections ||
          selections.length < current.maxSelections
        ) {
          newFormData = {
            ...formData,
            [name]: [...selections, value],
          };
        }
      } else {
        newFormData = {
          ...formData,
          [name]: selections.filter((v: string) => v !== value),
        };
      }
    } else {
      newFormData = { ...formData, [name]: value };
    }
    
    setFormData(newFormData);
    
    // Clear error message if the step becomes valid after this change
    if (errorMessage) {
      const answer = newFormData[current.key];
      let isValid = false;
      
      if (current.type === "text") isValid = true; // text inputs are optional
      if (current.type === "radio") isValid = typeof answer === "string" && answer.length > 0;
      if (current.type === "checkbox") {
        if (current.maxSelections) {
          isValid = Array.isArray(answer) && answer.length > 0 && answer.length <= current.maxSelections;
        } else {
          isValid = Array.isArray(answer) && answer.length > 0;
        }
      }
      if (current.type === "slider") isValid = typeof answer === "number";
      
      if (isValid) {
        setErrorMessage("");
      }
    }
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      userID,
      submitted_at: new Date().toLocaleString('da-DK', { timeZone: 'Europe/Copenhagen' }),
    };
    const result = await submitFeedback(payload);
    if (result) {
      console.log("Feedback submitted:", result);
      setSubmitted(true);
    } else {
      console.error("Submission failed.");
    }


    // Create downloadable file
    {/* 
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `feedback_${userID}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    */}

  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" style={{ fontSize: '1rem' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Feedback Questionnaire
        </h1>

        {submitted ? (
          <p className="text-center text-emerald-600 text-lg">
            Thank you for your feedback!
          </p>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600 text-center">
              Step {step + 1} of {steps.length}
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {current.label}
                </label>
                {current.type === "slider" && (
                  <>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{current.minLabel}</span>
                      <span>{current.maxLabel}</span>
                    </div>
                    <input
                      type="range"
                      name={current.key}
                      min="1"
                      max="5"
                      value={formData[current.key]}
                      onChange={handleChange}
                      className="w-full"
                      required
                    />
                    <div className="text-sm mt-1">
                      Selected: {formData[current.key]}
                    </div>
                  </>
                )}
                {current.type === "radio" &&
                  current.options?.map((opt) => (
                    <div key={opt} className="relative mb-1">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name={current.key}
                          value={opt}
                          checked={formData[current.key] === opt}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        {opt}
                        {tooltipImageMap[opt] && (
                          <span className="ml-2 text-xs text-blue-500 cursor-pointer relative group">
                            (?)
                            <div className="hidden group-hover:block absolute top-6 left-0 z-50">
                              <TooltipPreview src={tooltipImageMap[opt]} />
                            </div>
                          </span>
                        )}
                      </label>
                    </div>
                  ))}

                {current.type === "checkbox" &&
                  current.options?.map((opt) => (
                    <div key={opt} className="mb-1">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name={current.key}
                          value={opt}
                          checked={formData[current.key]?.includes(opt)}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        {opt}
                      </label>
                    </div>
                  ))}
                {current.type === "text" && (
                  <textarea
                    name={current.key}
                    value={formData[current.key] || ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border p-2 rounded"
                    placeholder="Type here..."
                  />
                )}
              </div>

              {/* Error message display */}
              {errorMessage && (
                <div className="text-red-600 text-sm mb-2 text-center">
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-between">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(""); // Clear error message when going back
                      setStep((s) => s - 1);
                    }}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Back
                  </button>
                )}
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isStepValid()) {
                        setErrorMessage(""); // Clear error message
                        setStep((s) => s + 1);
                      } else {
                        setErrorMessage("Please answer the question before continuing.");
                      }
                    }}
                    className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    Submit Feedback
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Questionnaire;