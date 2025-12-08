import React from "react";
import { Appliance } from "./types";

interface Props {
  scene: "floor" | "room3d";
  setScene: (scene: "floor" | "room3d") => void;
  pricePerKWh: number;
  setPricePerKWh: (v: number) => void;
  locked: boolean;
  setLocked: (b: boolean) => void;
  totalKWh: number;
  totalCost: number;
  appliances: Appliance[];
  setAppliances: (a: Appliance[]) => void;
}

export default function ControlsPanel({
  scene,
  setScene,
  pricePerKWh,
  setPricePerKWh,
  locked,
  setLocked,
  totalKWh,
  totalCost
}: Props) {
  return (
    <div className="flex flex-col gap-3 border rounded p-4 bg-white shadow-sm text-sm max-w-4xl mx-auto">
      {/* Scene + Price */}
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Electricity Price (Euro/kWh)
            <span className="ml-1 text-gray-400 text-xs">(from https://www.energidataservice.dk/)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={pricePerKWh.toFixed(2)}
              onChange={(e) => setPricePerKWh(Number(e.target.value))}
              disabled={locked}
              className="appearance-none border px-2 py-1 rounded text-sm w-24"
            />
            <button
              onClick={() => setLocked(!locked)}
              className="text-blue-600 text-xs underline"
            >
              {locked ? "Unlock" : "Lock"}
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="my-2" />

      {/* Summary Stats */}
      <div className="flex justify-between items-end mt-2">
        <div>
          <div className="text-xs text-gray-500">Total Usage</div>
          <div className="font-semibold text-base">{totalKWh.toFixed(2)} kWh/day</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 text-right">Estimated Cost</div>
          <div className="text-xl font-bold text-right text-red-600">{totalCost.toFixed(2)} Euro/day</div>
        </div>
      </div>
    </div>
  );
}
