import React, { useMemo } from "react";
import { Appliance } from "./types";
import EnergyChart from "../charts/EnergyChart";
import { useUI } from "../../context/UIContext";

type Props = {
    appliances: Appliance[];
    pricePerKWh: number;
};

export default function ChartsSection({ appliances, pricePerKWh }: Props) {
    const { uiState } = useUI();

    const consumptionData = useMemo(() => {
        return appliances
            .filter((a) => a.on)
            .map((a) => ({
                name: a.name,
                value: Number(((a.watts / 1000) * a.hoursPerDay).toFixed(2)),
            }));
    }, [appliances]);

    const costData = useMemo(() => {
        return appliances
            .filter((a) => a.on)
            .map((a) => {
                const kwh = (a.watts / 1000) * a.hoursPerDay;
                const cost = kwh * pricePerKWh;
                return {
                    name: a.name,
                    value: Number(cost.toFixed(2)),
                };
            });
    }, [appliances, pricePerKWh]);

    const consumType = uiState.consumption_graph === "line" ? "linechart" :
        (uiState.consumption_graph === "pie" ? "piechart" : "barchart");

    const costType = uiState.price_graph === "line" ? "linechart" :
        (uiState.price_graph === "bar" ? "barchart" : "piechart");

    const primaryColor = uiState.primary_color || "#4f46e5";

    return (
        <div className="grid grid-cols-2 gap-6">
            <div className="rounded-2xl border p-4 shadow-sm bg-white">
                <h2 className="text-lg font-semibold mb-3">Consumption (kWh/day)</h2>
                <EnergyChart
                    type={consumType}
                    data={consumptionData}
                    color={primaryColor}
                />
            </div>

            <div className="rounded-2xl border p-4 shadow-sm bg-white">
                <h2 className="text-lg font-semibold mb-3">Cost (Euro/day)</h2>
                <EnergyChart
                    type={costType}
                    data={costData}
                    color={primaryColor}
                />
            </div>
        </div>
    );
}