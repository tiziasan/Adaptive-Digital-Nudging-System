import React, { useRef, useState, useEffect } from "react";
import { Appliance } from "./types";
import { v4 as uuidv4 } from "uuid";
import { trackClick, trackMouseEnter, trackInitial } from "../../utils/sessionTracker";

interface Props {
    appliances: Appliance[];
    setAppliances: React.Dispatch<React.SetStateAction<Appliance[]>>;
    scene: "floor" | "room3d";
    setScene: (scene: "floor" | "room3d") => void;
    pricePerKWh?: number;
    // 1. ADD NEW PROP DEFINITION
    onApplianceClick?: (id: string) => void;
}

export default function ApplianceCanvas({
                                            appliances,
                                            setAppliances,
                                            scene,
                                            setScene,
                                            pricePerKWh = 0.35,
                                            // 2. DESTRUCTURE PROP
                                            onApplianceClick
                                        }: Props) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<string | null>(null);
    const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editWatts, setEditWatts] = useState<number>(0);
    const [editName, setEditName] = useState<string>("");
    const [editHours, setEditHours] = useState<number>(0);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("application/json");
        if (!data || !canvasRef.current) return;
        const parsed = JSON.parse(data);
        const rect = canvasRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const x = (px / rect.width) * 100;
        const y = (py / rect.height) * 100;
        const name = parsed.name + " #" + (appliances.length + 1);
        const newAppliance: Appliance = {
            id: uuidv4(),
            name,
            watts: parsed.watts,
            icon: parsed.icon || "⚡️",
            x,
            y,
            on: true,
            hoursPerDay: 2,
            clicks: 0
        };
        setAppliances([...appliances, newAppliance]);
    };

    const handleContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setAppliances(appliances.filter((a) => a.id !== id));
    };

    const handleDoubleClick = (id: string) => {
        const a = appliances.find((ap) => ap.id === id);
        if (!a) return;
        setEditingId(id);
        setEditWatts(a.watts);
        setEditName(a.name);
        setEditHours(a.hoursPerDay);
    };

    const updateAppliance = () => {
        if (!editingId) return;
        const updated = appliances.map((a) =>
            a.id === editingId
                ? { ...a, watts: editWatts, name: editName, hoursPerDay: editHours }
                : a
        );
        setAppliances(updated);
        setEditingId(null);
    };

    const handleMouseDown = (e: React.MouseEvent, id: string, appliance: Appliance) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;
        offsetRef.current = { x: clickX - appliance.x, y: clickY - appliance.y };
        draggingRef.current = id;
        trackClick(appliance);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const id = draggingRef.current;
        if (!id || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        const x = Math.min(100, Math.max(0, px - offsetRef.current.x));
        const y = Math.min(100, Math.max(0, py - offsetRef.current.y));
        const updated = appliances.map((a) =>
            a.id === id ? { ...a, x, y } : a
        );
        setAppliances(updated);
    };

    const handleMouseUp = () => {
        draggingRef.current = null;
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [appliances]);

    useEffect(() => {
        appliances.forEach((a) => trackInitial(a));
    }, [appliances]);

    const getColor = (watts: number, hrs: number) => {
        const kwh = (watts / 1000) * hrs;
        if (kwh < 1) return "bg-green-200";
        if (kwh < 2.5) return "bg-yellow-200";
        return "bg-red-300";
    };

    return (
        <div
            ref={canvasRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative w-full max-w-7xl mx-auto min-h-[500px] border rounded bg-blue-50 overflow-hidden select-none"
            style={{
                background: "#eff6ff",
                ["--canvas-bg" as any]: "#eff6ff",
                ["--canvas-accent-1" as any]: "#bbf7d0",
                ["--canvas-accent-2" as any]: "#fef08a",
                ["--canvas-accent-3" as any]: "#fca5a5",
            }}
        >
            <div className="absolute top-2 left-2 text-xs text-gray-600 bg-white border border-gray-300 px-2 py-1 rounded shadow">
                🖱️ Double-click an appliance to edit name, usage hours & wattage. Right-click to remove. Drag to move.
            </div>

            <div className="absolute top-2 right-2 text-xs text-gray-600 bg-white border border-gray-300 px-2 py-1 rounded shadow">
                <select
                    value={scene}
                    onChange={(e) => setScene(e.target.value as any)}
                    className="bg-white text-sm"
                >
                    <option value="floor">2D Floor</option>
                    <option value="room3d">3D Room</option>
                </select>
            </div>

            {appliances.map((a) => {
                const kwh = (a.watts / 1000) * a.hoursPerDay;
                const cost = kwh * pricePerKWh;
                return (
                    <div
                        key={a.id}
                        className={`absolute w-20 h-20 rounded-lg shadow-md flex items-center justify-center transition-all ${getColor(a.watts, a.hoursPerDay)} ${a.on ? "opacity-100" : "opacity-30"}`}
                        style={{
                            left: `${a.x}%`,
                            top: `${a.y}%`,
                            transform: "translate(-50%, -50%)"
                        }}
                        title={`${a.name}\n${a.watts} W\n${a.hoursPerDay.toFixed(1)} hrs/day\n${kwh.toFixed(2)} kWh/day\n${cost.toFixed(2)} euro/day`}

                        // 4. ADD ONCLICK HANDLER
                        onClick={(e) => {
                            // We check if it wasn't a drag operation (optional optimization, but simple click works fine)
                            onApplianceClick?.(a.id);
                        }}

                        onDoubleClick={() => handleDoubleClick(a.id)}
                        onMouseDown={(e) => handleMouseDown(e, a.id, a)}
                        onMouseEnter={() => trackMouseEnter(a)}
                        onContextMenu={(e) => handleContextMenu(e, a.id)}
                    >
                        <div className="flex flex-col items-center pointer-events-none">
                            <div className="text-2xl">{a.icon}</div>
                            <div className="text-[10px] text-center leading-tight mt-1 px-1">{a.name}</div>
                        </div>
                    </div>
                );
            })}

            {editingId !== null && (
                <div className="absolute top-4 left-4 bg-white shadow rounded p-3 border z-50 w-60">
                    <div className="text-sm font-medium mb-3">Edit Appliance</div>
                    <label className="text-xs text-gray-600">Name</label>
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border rounded px-2 py-1 text-sm mb-3 w-full"
                        placeholder="Name"
                    />
                    <label className="text-xs text-gray-600">Watts</label>
                    <input
                        type="number"
                        value={editWatts}
                        onChange={(e) => setEditWatts(Number(e.target.value))}
                        className="border rounded px-2 py-1 mb-3 w-full text-sm"
                        placeholder="Watts"
                    />
                    <label className="text-xs text-gray-600">Hours per day</label>
                    <input
                        type="range"
                        min={0}
                        max={24}
                        step={0.5}
                        value={editHours}
                        onChange={(e) => setEditHours(Number(e.target.value))}
                        className="w-full mb-1"
                    />
                    <div className="text-xs text-right text-gray-500 mb-3">{editHours} hrs/day</div>
                    <button
                        onClick={updateAppliance}
                        className="w-full text-sm px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}