"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import type { SubjectDistribution } from "@/types/dashboard";

type SubjectDistributionChartProps = {
  data: SubjectDistribution[];
};

const DEFAULT_BAR_COLOR = "hsl(var(--primary))";

export function SubjectDistributionChart({ data }: SubjectDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No topics completed yet
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-foreground">Topics by Subject</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 60)}>
        <BarChart data={data} layout="vertical" margin={{ left: 100, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis
            type="category"
            dataKey="subjectName"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            width={90}
          />
          <Tooltip
            formatter={(_value: unknown, _name: unknown, item: { payload?: SubjectDistribution }) => {
              const row = item.payload;
              if (!row) return ["", ""];
              return [`${row.completed} / ${row.total} (${row.percentage}%)`, "Completed"];
            }}
          />
          <Bar dataKey="completed" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.subjectColor ?? DEFAULT_BAR_COLOR}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
