"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Point = { date: string; weight: number };

export default function WeightChart({ data }: { data: Point[] }) {
  if (data.length < 2) {
    return <p style={{ fontSize: 14, color: "var(--text-dim)" }}>Log a few more entries to see a trend.</p>;
  }

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="var(--text-dim)"
            tick={{ fontSize: 11, fill: "var(--text-dim)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--text-dim)"
            tick={{ fontSize: 11, fill: "var(--text-dim)" }}
            tickLine={false}
            axisLine={false}
            domain={["dataMin - 2", "dataMax + 2"]}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
            }}
            labelStyle={{ color: "var(--text)" }}
            itemStyle={{ color: "var(--accent)" }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--accent)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}