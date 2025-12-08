import React from "react";
import { useNavigate } from "react-router-dom";

interface ConsentProps {
  onConsent: () => void;
}

const Consent: React.FC<ConsentProps> = ({ onConsent }) => {
  const navigate = useNavigate();

  const handleConsent = () => {
    onConsent();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Consent Required
        </h1>
        <p className="text-gray-600 text-center mb-6">
          This app uses facial expression detection to adapt your experience.  <br />
          Your facial expression values will be analyzed and stored, while still keeping your face and identity anonymous. <br />
          <b>Camera is not activated before consent is given.</b>
        </p>

        <div className="space-y-4">
          <button
            onClick={handleConsent}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
          >
            I Consent
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gray-300 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Consent;
