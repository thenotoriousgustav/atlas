'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { MonthlyChartItem, TrendChartItem, CategoryDistributionItem, WeeklyTrendItem } from '@atlas/api-client';

const COLOR_PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

interface HabitTrendChartProps {
  data: TrendChartItem[];
  goalValue: number;
  goalUnit?: string | null;
}

export function HabitTrendChart({ data, goalValue, goalUnit }: HabitTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs font-mono text-muted-foreground border border-dashed rounded-lg">
        No trend data recorded yet.
      </div>
    );
  }

  return (
    <div className="w-full h-56 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(str) => (str ? str.slice(5) : '')}
            tick={{ fontSize: 10, fill: '#888888' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 10, fill: '#888888' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
            formatter={(val: any) => [`${val} ${goalUnit || ''}`, 'Value']}
          />
          <ReferenceLine
            y={goalValue}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{ value: `Goal: ${goalValue}`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
          />
          <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#trendGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface HabitMonthlyBarChartProps {
  data: MonthlyChartItem[];
  goalUnit?: string | null;
}

export function HabitMonthlyBarChart({ data, goalUnit }: HabitMonthlyBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs font-mono text-muted-foreground border border-dashed rounded-lg">
        No monthly averages calculated yet.
      </div>
    );
  }

  return (
    <div className="w-full h-56 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888888' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#888888' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
            formatter={(val: any) => [`${val} ${goalUnit || ''}/day`, 'Avg Daily']}
          />
          <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface HabitCategoryPieChartProps {
  data: CategoryDistributionItem[];
}

export function HabitCategoryPieChart({ data }: HabitCategoryPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs font-mono text-muted-foreground border border-dashed rounded-lg">
        No categories available.
      </div>
    );
  }

  return (
    <div className="w-full h-56 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={4}
            dataKey="count"
            nameKey="category"
            label={({ category, percentage }: any) => `${category} (${percentage}%)`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
            formatter={(val: any) => [`${val} trackers`, 'Count']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface HabitCategoryRadarChartProps {
  data: CategoryDistributionItem[];
}

export function HabitCategoryRadarChart({ data }: HabitCategoryRadarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs font-mono text-muted-foreground border border-dashed rounded-lg">
        No categories for radar view.
      </div>
    );
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#888888' }} />
          <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={{ fontSize: 9, fill: '#888888' }} />
          <Radar name="Trackers" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface WeeklyTrendChartProps {
  data: WeeklyTrendItem[];
}

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs font-mono text-muted-foreground border border-dashed rounded-lg">
        No weekly trend data available.
      </div>
    );
  }

  return (
    <div className="w-full h-56 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={(str) => str.slice(5)} tick={{ fontSize: 10, fill: '#888888' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#888888' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
            formatter={(val: any, name: any) => [val, name === 'completed' ? 'Completed Habits' : 'Total Habits']}
          />
          <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="completed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
