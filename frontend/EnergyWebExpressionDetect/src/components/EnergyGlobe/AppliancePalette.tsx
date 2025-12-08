import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Appliance } from "./types";

const defaultLibrary: Omit<Appliance, "x" | "y" | "on" | "id" | "hoursPerDay">[] = [
  { name: "Fridge", watts: 120, icon: "🧊" },
  { name: "Oven", watts: 2400, icon: "🍽️" },
  { name: "Kettle", watts: 1800, icon: "🔋" },
  { name: "TV", watts: 90, icon: "📺" },
  { name: "Laptop", watts: 65, icon: "💻" },
  { name: "Heater", watts: 2000, icon: "🔥" },
  { name: "Washer", watts: 700, icon: "🧺" },
  { name: "AC", watts: 850, icon: "🌬️" },
  { name: "Dishwasher", watts: 1300, icon: "🍽️" },
  { name: "Microwave", watts: 1100, icon: "📡" }
];


const emojiCategories = {
  Kitchen: ["🍞", "🍳", "🍽️", "🥘", "🧊", "🧂"],
  Entertainment: ["📺", "💻", "🖥️", "🎧", "🎮", "📷"],
  HeatingCooling: ["🔥", "❄️", "🌬️", "🧯"],
  Utilities: ["🔋", "🔌", "💡", "🚿", "🧺", "🛁"]
};

export default function AppliancePalette() {
  const [library, setLibrary] = useState([...defaultLibrary]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [watts, setWatts] = useState(0);
  const [icon, setIcon] = useState("⚡️");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customHours, setCustomHours] = useState(1);

  const handleCreate = () => {
    if (!name || watts <= 0 || !icon) return;
    const newItem = { name, watts, icon, hoursPerDay: customHours };
    setLibrary((prev) => [...prev, newItem]);
    setName("");
    setWatts(0);
    setIcon("⚡️");
    setCustomHours(1);
    setShowForm(false);
    setShowEmojiPicker(false);
  };

  return (
    <div className="mt-4 border-t pt-3">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Add Appliances</h3>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {library.map((item, i) => (
          <div
            key={item.name + i}
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData(
                "application/json",
                JSON.stringify({ ...item, id: uuidv4(), x: 10, y: 10, on: true })
              )
            }
            className="flex flex-col items-center justify-center w-20 h-20 border rounded bg-white shadow text-center cursor-grab hover:shadow-md"
            title={`${item.name} (${item.watts}W)`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs mt-1 text-gray-700">{item.name}</span>
          </div>
        ))}

        <div
          onClick={() => setShowForm(true)}
          className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 cursor-pointer"
        >
          <span className="text-2xl">➕</span>
          <span className="text-xs mt-1">Custom</span>
        </div>
      </div>

      {showForm && (
        <div className="mt-3 p-3 border rounded bg-gray-50 space-y-3 w-full max-w-md">
          <div className="text-sm font-semibold mb-1">Create Custom Appliance</div>

          <div className="space-y-2">
            <label className="block text-xs text-gray-600">Name</label>
            <input
              type="text"
              placeholder="e.g. Toaster"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border px-2 py-1 rounded text-sm w-full"
            />

            <label className="block text-xs text-gray-600">Watts</label>
            <input
              type="number"
              placeholder="e.g. 750"
              value={watts}
              onChange={(e) => setWatts(Number(e.target.value))}
              className="appearance-none border px-2 py-1 rounded text-sm w-full"
            />

            <label className="block text-xs text-gray-600">Usage (hrs/day)</label>
            <input
              type="range"
              min={0}
              max={24}
              step={0.5}
              value={customHours}
              onChange={(e) => setCustomHours(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-right text-gray-500">{customHours} hrs/day</div>

            <label className="block text-xs text-gray-600">Icon (emoji)</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={2}
                placeholder="e.g. 🍞"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="border px-2 py-1 rounded text-sm w-full"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                {showEmojiPicker ? "Hide" : "Pick"}
              </button>
            </div>

            {showEmojiPicker && (
              <div className="space-y-2 mt-2">
                {Object.entries(emojiCategories).map(([label, icons]) => (
                  <div key={label}>
                    <div className="text-xs text-gray-500 mb-1 font-medium">{label}</div>
                    <div className="grid grid-cols-6 gap-2 text-xl">
                      {icons.map((e) => (
                        <button
                          key={e}
                          onClick={() => {
                            setIcon(e);
                            setShowEmojiPicker(false);
                          }}
                          className="hover:scale-110 transition-transform"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Appliance
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
