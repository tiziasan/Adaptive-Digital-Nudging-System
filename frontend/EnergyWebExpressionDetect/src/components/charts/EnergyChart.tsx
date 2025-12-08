import React from "react";
import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from "recharts";

type ChartType = "barchart" | "piechart" | "linechart";

type Props = {
    type: ChartType;
    data: Array<{ name: string; value: number }>;
    height?: number;
    color?: string; // 2. Add color prop
};

const PIE_COLORS = [
    "#4f46e5", "#22c55e", "#f59e0b", "#ef4444",
    "#06b6d4", "#a855f7", "#10b981", "#eab308",
    "#3b82f6", "#f97316"
];

export default function EnergyChart({ type, data, height = 280, color = "#4f46e5" }: Props) {

    if (type === "piechart") {
        return (
            <div style={{ width: "100%", height }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            dataKey="value"
                            data={data}
                            label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
                            outerRadius="80%"
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => v.toFixed(1)} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (type === "linechart") {
        return (
            <div style={{ width: "100%", height }}>
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={3}
                            dot={{ r: 4, fill: color }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }

    // Default: BarChart
    return (
        <div style={{ width: "100%", height }}>
            <ResponsiveContainer>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}