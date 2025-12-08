import React, { useState, useEffect, useRef} from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, Settings, Plus } from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
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

interface PowerBreakdown {
    [key: string]: number;
}

const AVERAGE_ANNUAL_CONSUMPTION_KWH = 6180;
const AVERAGE_DAILY_CONSUMPTION_KWH = AVERAGE_ANNUAL_CONSUMPTION_KWH / 365;
const DENMARK_POPULATION = 5900000;
const TOTAL_HOUSEHOLDS = DENMARK_POPULATION / 2.2;
const SIMILAR_HOUSEHOLDS_CONSUMPTION = 11.33;

function ConsumptionDashboard({ mood, onVisit }: Props) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [householdConsumption, setHouseholdConsumption] = useState(0);
    const [powerBreakdown, setPowerBreakdown] = useState<PowerBreakdown>({});
    const [hourlyConsumptionData, setHourlyConsumptionData] = useState<any[]>([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [progress, setProgress] = useState(0);

    const { uiState } = useUI();

    const PRIMARY_COLOR = uiState.primary_color || '#047857';
    const SECONDARY_COLOR = uiState.secondary_color || '#22C55E';

    const COLORS = [
        PRIMARY_COLOR,
        SECONDARY_COLOR,
        '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];

    const ENERGY_API = import.meta.env.DEV ? "http://localhost:5000" : "";

    useEffect(() => {
        onVisit();
    }, [onVisit]);

    const calendarRef = useRef<HTMLDivElement>(null);
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const [priceData, setPriceData] = useState<PriceData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const minDate = new Date("2022-11-01");
    const maxDate = new Date();
    const [showPriceOverview, setShowPriceOverview] = useState(false);

    if (currentHour >= 13) {
        maxDate.setDate(maxDate.getDate() + 1);
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };
        if (showCalendar) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showCalendar]);

    useEffect(() => {
        const fetchPrices = async () => {
            setLoading(true);
            try {
                const formattedDate = format(selectedDate, "yyyy-MM-dd");
                const response = await fetch(`${ENERGY_API}/api/prices/${formattedDate}`);
                const data = await response.json();
                if (!Array.isArray(data)) return;
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
    }, [selectedDate]);

    const currentPrice = priceData.find((d) => d.hour === currentHour)?.price ?? 0;

    const fetchData = async (url: string, handler: (data: any) => void) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            handler(data);
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error);
        }
    };

    useEffect(() => {
        fetchData(`${ENERGY_API}/api/power-breakdown`, (data) => {
            if (data?.powerConsumptionTotal) {
                setPowerBreakdown(data.powerConsumptionBreakdown);
                const consumptionKWh = data.powerConsumptionTotal * 1000;
                const householdKWh = consumptionKWh / TOTAL_HOUSEHOLDS;
                setHouseholdConsumption(householdKWh);
                setProgress((householdKWh / AVERAGE_DAILY_CONSUMPTION_KWH) * 800);
            }
        });
    }, [selectedDate]);

    useEffect(() => {
        fetchData(`${ENERGY_API}/api/power-breakdown/history`, (data) => {
            if (data?.history) {
                const formattedData = data.history.map((item: any) => ({
                    hour: new Date(item.datetime).getHours(),
                    consumption: (item.powerConsumptionTotal * 1000) / TOTAL_HOUSEHOLDS,
                }));
                setHourlyConsumptionData(formattedData);
            }
        });
    }, []);

    const breakdownData = Object.entries(powerBreakdown).map(([key, value]) => ({
        source: key,
        consumption: value,
    }));

    const sortedSources = breakdownData.sort((a, b) => b.consumption - a.consumption);
    const minSourcesToShow = 4;
    const topSources = sortedSources.slice(0, minSourcesToShow);
    const otherSources = sortedSources.slice(minSourcesToShow);
    const otherTotal = otherSources.reduce((sum, entry) => sum + entry.consumption, 0);

    const pieData = [...topSources];
    if (otherTotal > 0) {
        pieData.push({ source: 'Other', consumption: otherTotal });
    }

    const otherBreakdownDetails = otherSources.map((entry) => ({
        name: entry.source,
        value: entry.consumption,
    }));

    const percentageDiff = (((SIMILAR_HOUSEHOLDS_CONSUMPTION - householdConsumption) / SIMILAR_HOUSEHOLDS_CONSUMPTION) * 80).toFixed(1);

    const [funFact, setFunFact] = useState<string | null>(null);
    const funFacts = [
        "The average LED bulb uses 90% less energy than an incandescent one!",
        "Charging your phone overnight costs less than 1 krone a month.",
        "Dishwashers use less water than washing by hand — if you fully load them!",
        "Turning off your devices at the wall can save up to 10% of your electricity bill.",
        "The energy used by idle electronics is called 'phantom load'.",
        "Lowering your thermostat by 1°C can cut your energy use by 5-10%.",
    ];

    useEffect(() => {
        const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
        setFunFact(randomFact);
    }, []);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload?.[0]?.payload?.source === 'Other') {
            return (
                <div className="bg-white shadow-md border border-gray-200 p-3 rounded text-sm text-gray-800">
                    <p className="font-semibold mb-1">Other includes:</p>
                    <ul className="space-y-1">
                        {otherBreakdownDetails.map((item) => (
                            <li key={item.name}>
                                <span className="font-medium">{item.name}:</span> {item.value.toFixed(2)} MW
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        if (active && payload?.[0]) {
            return (
                <div className="bg-white shadow-md border border-gray-200 p-3 rounded text-sm text-gray-800">
                    <p className="font-medium">{payload[0].payload.source || label}</p>
                    <p>{payload[0].value.toFixed(2)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`min-h-screen`}>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="col-span-1">

                        {/* Consumption Overview */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-[1em] font-semibold text-gray-800">Consumption Overview</h1>
                            </div>

                            <div className="relative mb-8">
                                <div className="w-64 h-64 mx-auto">
                                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" className="opacity-25"/>
                                        <circle
                                            cx="50" cy="50" r="45" fill="none"
                                            stroke={PRIMARY_COLOR}
                                            strokeWidth="6"
                                            strokeDasharray={`${progress * 2.83} 283`}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-800">
                                        <span className="text-[1em] font-bold">{householdConsumption.toFixed(2)} kWh</span>
                                        <span className="text-[0.5em] text-gray-600">{progress.toFixed(1)}% of average</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center font-medium text-[0.6em] mb-6" style={{ color: PRIMARY_COLOR }}>
                                You've used {percentageDiff}% less power than similar households
                            </p>
                        </div>

                        {/* Energy Source Breakdown - DYNAMIC SWITCH PIE/BAR */}
                        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
                            <h3 className="text-[1em] font-semibold text-gray-800 mb-4">Energy Source Breakdown</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                {uiState.consumption_graph === 'bar' ? (
                                    // --- BAR CHART OPTION ---
                                    <BarChart data={pieData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis dataKey="source" tick={{ fontSize: '0.8em' }} />
                                        <YAxis tick={{ fontSize: '0.8em' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="consumption">
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                ) : (
                                    // --- PIE CHART OPTION (Default/Line) ---
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="consumption"
                                            nameKey="source"
                                            cx="50%" cy="50%"
                                            outerRadius={120}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                )}
                            </ResponsiveContainer>
                        </div>

                        {/* FUN FACT */}
                        <div className="bg-white rounded-lg shadow-md p-8 mt-4">
                            <h3 className="text-[1em] font-semibold mb-2" style={{ color: PRIMARY_COLOR }}>Random Energy Fact</h3>
                            {funFact && <p className="mt-4 text-gray-700 text-sm">{funFact}</p>}
                        </div>
                    </div>

                    <div className='bg-white rounded-lg shadow-md p-8'>

                        {/* HOURLY CONSUMPTION */}
                        <h2 className="text-[1em] font-semibold text-gray-800 mb-6">Energy consumption (24h)</h2>
                        <div className="w-full">
                            <ResponsiveContainer width="100%" height={350}>
                                {uiState.consumption_graph === 'line' ? (
                                    <LineChart data={hourlyConsumptionData} margin={{ top: 20, right: 20, left: 5, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="hour" tick={{ fontSize: '0.8em' }} tickFormatter={(hour) => `${hour}:00`} />
                                        <YAxis tick={{ fontSize: '0.8em' }} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="consumption"
                                            stroke={PRIMARY_COLOR}
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: PRIMARY_COLOR }}
                                        />
                                    </LineChart>
                                ) : (
                                    <BarChart data={hourlyConsumptionData} margin={{ top: 20, right: 20, left: 5, bottom: 5 }}>
                                        <XAxis dataKey="hour" tick={{ fontSize: '0.8em' }} tickFormatter={(hour) => `${hour.toString().padStart(2, '0')}:00`} />
                                        <YAxis tick={{ fontSize: '0.8em' }} />
                                        <Tooltip formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Consumption']} />
                                        <Bar dataKey="consumption" fill={PRIMARY_COLOR} radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-12">
                            {/* ENERGY PRICES CHART */}
                            <div>
                                <h2 className="text-[1em] font-semibold text-gray-800 mb-4 mt-12">Energy Prices Today</h2>
                                <button onClick={() => setShowCalendar(true)} className="text-[0.9em] font-medium" style={{ color: PRIMARY_COLOR }}>
                                    {format(selectedDate, 'MMMM do, yyyy')}
                                </button>

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

                                <div className="w-full">
                                    <ResponsiveContainer width="100%" height={350}>
                                        {uiState.price_graph === 'line' ? (
                                            <LineChart data={priceData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="hour" tick={{ fontSize: '0.8em' }} tickFormatter={(hour) => `${hour}:00`} />
                                                <YAxis tick={{ fontSize: '0.8em' }} tickFormatter={(v) => `${v.toFixed(2)} Euro.`} />
                                                <Tooltip />
                                                <ReferenceLine x={currentHour} stroke="red" label="Now" strokeDasharray="3 3" />
                                                <Line
                                                    type="step"
                                                    dataKey="price"
                                                    stroke={PRIMARY_COLOR}
                                                    strokeWidth={3}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        ) : (
                                            <BarChart data={priceData}>
                                                <XAxis dataKey="hour" tick={{ fontSize: '0.8em' }} tickFormatter={(hour) => `${hour}:00`} />
                                                <YAxis tick={{ fontSize: '0.8em' }} tickFormatter={(v) => `${v.toFixed(2)} Euro.`} />
                                                <Tooltip
                                                    formatter={(value: number) => [`${value.toFixed(2)} Euro.`, "Price"]}
                                                    labelFormatter={(hour) => `${hour}:00`}
                                                />
                                                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                                                <Bar
                                                    dataKey="price"
                                                    radius={[4, 4, 0, 0]}
                                                    fill={PRIMARY_COLOR}
                                                    shape={(props: any) => {
                                                        const { payload, x, y, width, height } = props;
                                                        const isCurrent = payload.hour === currentHour;
                                                        const fill = isCurrent ? SECONDARY_COLOR : PRIMARY_COLOR;
                                                        return (
                                                            <rect
                                                                x={x}
                                                                y={height < 0 ? y + height : y}
                                                                width={width}
                                                                height={Math.abs(height)}
                                                                fill={fill}
                                                            />
                                                        );
                                                    }}
                                                />
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* CURRENT PRICE CARD */}
                            <div className="bg-gray-50 p-6 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold border-b border-gray-600 mb-2">UI CONTEXT DEBUGGER</h3>
                                        <pre>{JSON.stringify(uiState, null, 2)}</pre>
                                        <span className="text-[0.9em] text-gray-900">Current Price</span>
                                        <div className="text-gray-500 text-[0.9em]">as of {format(currentTime, 'HH:mm')}</div>
                                    </div>
                                    <span className="text-[0.9em] font-bold" style={{ color: PRIMARY_COLOR }}>{currentPrice.toFixed(2)} Euro.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConsumptionDashboard;