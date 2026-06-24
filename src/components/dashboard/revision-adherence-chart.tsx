"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { RevisionAdherence } from "@/types/dashboard";

type RevisionAdherenceChartProps = {
  data: RevisionAdherence[];
};

export function RevisionAdherenceChart({ data }: RevisionAdherenceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No revision data yet
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    weekLabel: new Date(d.weekStart + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-foreground">Revision Adherence</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            label={{ value: "Revisions", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
          />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="scheduled"
            fill="hsl(var(--muted-foreground))"
            name="Scheduled"
            radius={[4, 4, 0, 0]}
            opacity={0.5}
          />
          <Bar
            dataKey="completed"
            fill="hsl(var(--primary))"
            name="Completed"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
