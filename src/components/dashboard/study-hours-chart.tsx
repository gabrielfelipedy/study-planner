"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { WeeklyStudyHours } from "@/types/dashboard";

type WeeklyStudyHoursChartProps = {
  data: WeeklyStudyHours[];
};

export function WeeklyStudyHoursChart({ data }: WeeklyStudyHoursChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Select a plan to see weekly study hours
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
      <h3 className="mb-4 text-sm font-medium text-foreground">Weekly Study Hours</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" label={{ value: "Hours", angle: -90, position: "insideLeft", style: { fontSize: 12 } }} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="plannedHours"
            fill="hsl(var(--muted-foreground))"
            name="Planned"
            radius={[4, 4, 0, 0]}
            opacity={0.5}
          />
          <Bar
            dataKey="actualHours"
            fill="hsl(var(--primary))"
            name="Actual"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
