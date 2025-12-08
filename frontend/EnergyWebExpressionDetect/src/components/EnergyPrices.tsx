import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Settings, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useUI } from "../context/UIContext";

interface Props {
  mood: string;
  onVisit: () => void;
}

interface PriceData {
  hour: number;
  price: number;
}

// Old Mock data for the price chart
const priceData = [
  { hour: 0, price: 1.0 },
  { hour: 1, price: 0.9 },
  { hour: 2, price: 0.9 },
  { hour: 3, price: 0.9 },
  { hour: 4, price: 1.0 },
  { hour: 5, price: 1.1 },
  { hour: 6, price: 1.3 },
  { hour: 7, price: 1.7 },
  { hour: 8, price: 1.8 },
  { hour: 9, price: 2.0 },
  { hour: 10, price: 1.7 },
  { hour: 11, price: 1.5 },
  ...Array.from({ length: 12 }, (_, i) => ({
    hour: i + 12,
    price: 1.0 + Math.sin(i / 4) * 0.5,
  })),
];

function EnergyPrices({mood, onVisit}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const ENERGY_API = import.meta.env.DEV ? "http://localhost:5000" : "";

  const minDate = new Date("2022-11-01"); // Minimum selectable date (Nov 1, 2022)
  const maxDate = new Date(); 

  // Allow selecting tomorrow only if it's past 13:00
  if (currentHour >= 13) {
    maxDate.setDate(maxDate.getDate() + 1);
  }
  
  const { uiState } = useUI();

  useEffect(() => {
    onVisit(); // Mark the dashboard as visited when this component mounts
  }, [onVisit]);
  
    // Close calendar if clicked outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
          setShowCalendar(false);
        }
      };
  
      if (showCalendar) {
        document.addEventListener("mousedown", handleClickOutside);
      }
  
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showCalendar]);

  // Fetch prices from the proxy server based on the selected date
  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const response = await fetch(`${ENERGY_API}/api/prices/${formattedDate}`);
        const data = await response.json();
  
        if (!Array.isArray(data)) {
          console.error("Invalid API response format:", data);
          return;
        }
  
        setPriceData(
          data.map((entry: any) => ({
            hour: new Date(entry.time_start).getHours(),
            price: entry.DKK_per_kWh,
          }))
        );
      } catch (error) {
        console.error("Error fetching energy prices:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrices();
  }, [selectedDate]); // Runs whenever selectedDate changes

  // Get current hour and determine lowest, current, and next hour prices
  const currentPrice = priceData.find((d) => d.hour === currentHour)?.price ?? 0;
  const lowestPrice = Math.min(...priceData.map((d) => d.price), Infinity);
  const lowestPriceHour = priceData.find((d) => d.price === lowestPrice)?.hour ?? 0;
  const nextHourPrice = priceData.find((d) => d.hour === (currentHour + 1) % 24)?.price ?? 0;
  const highestPrice = Math.max(...priceData.map((d) => d.price), -Infinity);
  const highestPriceHour = priceData.find((d) => d.price === highestPrice)?.hour ?? 0;

  return (
    <div className={`min-h-screen ${uiState.background_color} text-${uiState.font_size}`}>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-800">Energy Prices</h1>
              <button 
                onClick={() => setShowCalendar(true)} 
                className="text-lg font-medium text-primary"
              >
                {format(selectedDate, 'MMMM do, yyyy')}
              </button>
            </div>

            {showCalendar && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-lg" ref={calendarRef}>
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date && date >= minDate && date <= maxDate) {
                        setSelectedDate(date);
                      }
                      setShowCalendar(false);
                    }}
                    className="border-0"
                    disabled={{ before: minDate, after: maxDate }}
                  />
                </div>
              </div>
            )}

            {/* Energy Bar Chart */}
            <div className="h-[400px] w-full mb-8">
              {loading ? (
                <p className="text-center text-gray-600">Loading prices...</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceData}>
                    {/* X-Axis */}
                    <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />

                    {/* Y-Axis (Adjust domain for negative values & show currency) */}
                    <YAxis
                      domain={[
                        Math.min(...priceData.map((d) => d.price)) - 0.005,
                        Math.max(...priceData.map((d) => d.price))
                      ]}
                      tickFormatter={(value) => `${value.toFixed(2)} kr.`}
                    />

                    {/* Tooltip */}
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(2)} kr.`, "Price"]}
                      labelFormatter={(hour) => `${hour}:00`}
                      contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #ccc", padding: "8px" }}
                    />

                    {/* Reference Line at Zero for Negative Prices */}
                    <ReferenceLine y={0} stroke="#ccc" strokeWidth={2} strokeDasharray="5 5" />
                    
                    {/* Bars */}
                    <Bar
                      dataKey="price"
                      radius={[4, 4, 0, 0]}
                      shape={(props: any) => {
                        const { payload, x, y, width, height } = props;
                        const isCurrentHour = payload.hour === currentHour;
                        const isNegative = payload.price < 0;
                        return (
                          <rect
                            x={x}
                            y={isNegative ? y + height : y} // Shift negative bars downward
                            width={width}
                            height={Math.abs(height)} // Ensure height is always positive
                            fill={isCurrentHour ? (uiState.secondary_color || "#22C55E") : isNegative ? "#3B82F6" : (uiState.primary_color || "#047857")} // Blue for negative values
                            stroke={isCurrentHour ? "#16A34A" : "none"}
                            strokeWidth={isCurrentHour ? 2 : 0}
                            style={
                              isCurrentHour
                                ? { filter: "drop-shadow(0px 0px 6px rgba(34, 197, 94, 0.7))" } // Highlight effect
                                : {}
                            }
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-xl text-gray-900">Current Price</span>
                  <div className="text-gray-500">as of {format(currentTime, 'HH:mm')}</div>
                </div>
                <span className="text-3xl font-bold text-primary">{currentPrice.toFixed(2)} kr.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Prices shown incl. VAT, transport, taxes.</span>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Price Overview</h2>

            <div className="space-y-6">
              {/* Lowest Price */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-medium">Lowest price</div>
                    <div className="text-gray-600">{`${lowestPriceHour}:00 - ${lowestPriceHour + 1}:00`}</div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{lowestPrice.toFixed(2)} kr.</span>
                </div>
              </div>

              {/* Lowest Price */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-medium">Highest price</div>
                    <div className="text-gray-600">{`${highestPriceHour}:00 - ${highestPriceHour + 1}:00`}</div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{highestPrice.toFixed(2)} kr.</span>
                </div>
              </div>

              {/* Current Price */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-medium">Current Price</div>
                    <div className="text-gray-600">as of {format(currentTime, "HH:mm")}</div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{currentPrice.toFixed(2)} kr.</span>
                </div>
              </div>

              {/* Next Hour */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-medium">Next Hour's Price</div>
                    <div className="text-gray-600">as of {format(new Date(currentTime.getTime() + 60 * 60 * 1000), "HH")}:00</div>
                  </div>
                  <span className="text-2xl font-bold text-gray-700">{nextHourPrice.toFixed(2)} kr.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnergyPrices;