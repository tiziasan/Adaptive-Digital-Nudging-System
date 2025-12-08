import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart2, Zap, ClipboardList, LogOut } from "lucide-react";

interface NavbarProps {
  onLogout: () => void;
  hasVisitedDashboard: boolean;
  hasVisitedPrices: boolean;
}

function Navbar({ onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isQuestionnaireVisible, setIsQuestionnaireVisible] = React.useState(false);
  const [showQuestionnaireAlert, setShowQuestionnaireAlert] = React.useState(false);

  useEffect(() => {
    // Set a timer to show the questionnaire tab after 20 seconds
    const timer = setTimeout(() => {
      setIsQuestionnaireVisible(true);
      setShowQuestionnaireAlert(true);

      // Set another timer to hide the alert after 3 seconds
      setTimeout(() => {
        setShowQuestionnaireAlert(false);
      }, 3000);
    }, 20000);

    // Clean up the timer when the component unmounts
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = () => {
    onLogout();
    localStorage.removeItem('authToken');
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md">
      {/* Alert for new questionnaire tab */}
      {showQuestionnaireAlert && (
        <div className="absolute top-4 right-4 bg-primary text-white px-4 py-2 rounded-md shadow-lg text-sm font-medium z-50 animate-fade-in-out">
          Questionnaire is now available!
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center items-center h-16">
        <div className="text-primary font-bold text-sm mr-7 sm:mr-6"></div>

  
          <div className="flex space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar">
            {/* Consumption */}
            <button
              onClick={() => navigate("/dashboard")}
              className={`flex items-center space-x-1 border-b-2 text-sm font-medium ${
                location.pathname === "/dashboard"
                  ? "border-primary text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <Zap className="w-5 h-5" />
              <span className={`${location.pathname === "/dashboard" ? "inline" : "hidden sm:inline"}`}>
                Consumption
              </span>
            </button>
  
            {/* Energy Prices 
            <button
              onClick={() => navigate("/prices")}
              className={`flex items-center space-x-1 border-b-2 text-sm font-medium ${
                location.pathname === "/prices"
                  ? "border-primary text-gray-900"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <BarChart2 className="w-5 h-5" />
              <span className={`${location.pathname === "/prices" ? "inline" : "hidden sm:inline"}`}>
                Energy Prices
              </span>
            </button>
            */}
  
            {/* Questionnaire */}
            {isQuestionnaireVisible && (
              <button
                onClick={() => navigate("/questionnaire")}
                className={`flex items-center space-x-1 border-b-2 text-sm font-medium ${
                  location.pathname === "/questionnaire"
                    ? "border-primary text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                <span className={`${location.pathname === "/questionnaire" ? "inline" : "hidden sm:inline"}`}>
                  Questionnaire
                </span>
              </button>
            )}
          </div>
  
          {/* Sign out 
          <div className="ml-auto sm:ml-0">
            <button
              onClick={handleSignOut}
              className="flex items-center text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              <LogOut className="w-5 h-5 sm:hidden" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
          */}
        </div>
      </div>
    </nav>
  );
}  

export default Navbar;
