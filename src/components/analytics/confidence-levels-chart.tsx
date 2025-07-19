import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import type { ChartDataItem } from './types';

interface ConfidenceLevelsChartProps {
  chartData: ChartDataItem[];
}

export const ConfidenceLevelsChart: React.FC<ConfidenceLevelsChartProps> = ({
  chartData,
}) => {
  return (
    <Card className="glassmorphism border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Intent Confidence Levels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Bar dataKey="confidence" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};