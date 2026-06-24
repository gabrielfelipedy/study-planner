"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { CompletionDataPoint } from "@/types/dashboard";

type CompletionOverTimeChartProps = {
  data: CompletionDataPoint[];
};

export function CompletionOverTimeChart({ data }: CompletionOverTimeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Complete your first topic to see progress
        </p>
      </div>
    );
  }

  // Format dates for display
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-foreground">Completion Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            yAxisId="left"
            dataKey="completed"
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            label={{ value: "Topics", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            label={{ value: "%", angle: 90, position: "insideRight", style: { fontSize: 12 } }}
          />
          <Tooltip />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="completed"
            fill="hsl(var(--primary))"
            name="Daily completions"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativePercentage"
            stroke="hsl(var(--chart-2))"
            name="Cumulative %"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
