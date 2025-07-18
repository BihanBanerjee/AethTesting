import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Code, 
  Zap, 
  Search, 
  Bug, 
  Wrench, 
  Lightbulb,
  TrendingUp,
  FileText,
  Star,
  Activity,
  Clock,
} from 'lucide-react';

// Mock data - replace with actual API call
const mockAnalytics = {
  intentDistribution: [
    { intent: 'code_generation', _count: { intent: 25 }, _avg: { confidence: 0.85 } },
    { intent: 'debug', _count: { intent: 18 }, _avg: { confidence: 0.92 } },
    { intent: 'explain', _count: { intent: 15 }, _avg: { confidence: 0.78 } },
    { intent: 'code_review', _count: { intent: 12 }, _avg: { confidence: 0.88 } },
    { intent: 'code_improvement', _count: { intent: 8 }, _avg: { confidence: 0.81 } },
    { intent: 'question', _count: { intent: 22 }, _avg: { confidence: 0.75 } }
  ],
  codeGeneration: {
    totalGenerated: 45,
    avgSatisfaction: 4.2,
    avgLinesOfCode: 87,
    totalApplied: 32,
    totalModified: 28,
    applicationRate: 0.71
  },
  satisfaction: {
    avgRating: 4.1,
    totalRatings: 89
  },
  mostReferencedFiles: [
    { fileName: 'src/components/ui/button.tsx', queryCount: 15, contextUseCount: 12 },
    { fileName: 'src/lib/utils.ts', queryCount: 12, contextUseCount: 8 },
    { fileName: 'src/app/layout.tsx', queryCount: 10, contextUseCount: 7 },
    { fileName: 'prisma/schema.prisma', queryCount: 9, contextUseCount: 6 },
    { fileName: 'src/server/api/trpc.ts', queryCount: 8, contextUseCount: 5 }
  ],
  recentInteractions: [
    { intent: 'code_generation', confidence: 0.89, helpful: true, rating: 5, responseTime: 2340 },
    { intent: 'debug', confidence: 0.94, helpful: true, rating: 4, responseTime: 1890 },
    { intent: 'explain', confidence: 0.76, helpful: true, rating: 4, responseTime: 1560 },
    { intent: 'code_review', confidence: 0.91, helpful: false, rating: 3, responseTime: 3200 }
  ]
};

const intentColors = {
  code_generation: '#10B981',
  debug: '#EF4444', 
  explain: '#8B5CF6',
  code_review: '#F59E0B',
  code_improvement: '#06B6D4',
  question: '#6B7280',
  refactor: '#EC4899'
};

const intentIcons = {
  code_generation: Code,
  debug: Bug,
  explain: Lightbulb,
  code_review: Search,
  code_improvement: Zap,
  question: FileText,
  refactor: Wrench
};

const AIAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('month');
  const analytics = mockAnalytics; // Replace with actual API call

  const getIntentIcon = (intent: string) => {
    const Icon = intentIcons[intent] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const formatIntent = (intent: string) => {
    return intent.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const chartData = analytics.intentDistribution.map(item => ({
    name: formatIntent(item.intent),
    count: item._count.intent,
    confidence: Math.round(item._avg.confidence * 100),
    fill: intentColors[item.intent] || '#6B7280'
  }));

  return (
    <div className="space-y-6 p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
            AI Interaction Analytics
          </h2>
          <p className="text-white/70 mt-1">
            Insights into your AI-powered development workflow
          </p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glassmorphism border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">
              Total Interactions
            </CardTitle>
            <Activity className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.intentDistribution.reduce((sum, item) => sum + item._count.intent, 0)}
            </div>
            <p className="text-xs text-white/60">
              +12% from last {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">
              Code Generated
            </CardTitle>
            <Code className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.codeGeneration.totalGenerated}
            </div>
            <p className="text-xs text-white/60">
              {Math.round(analytics.codeGeneration.applicationRate * 100)}% applied rate
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">
              Avg Satisfaction
            </CardTitle>
            <Star className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.satisfaction.avgRating}/5
            </div>
            <p className="text-xs text-white/60">
              From {analytics.satisfaction.totalRatings} ratings
            </p>
          </CardContent>
        </Card>

        <Card className="glassmorphism border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {Math.round(analytics.recentInteractions.reduce((sum, i) => sum + i.responseTime, 0) / analytics.recentInteractions.length / 1000)}s
            </div>
            <p className="text-xs text-white/60">
              -15% improvement
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intent Distribution Chart */}
        <Card className="glassmorphism border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Intent Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Levels */}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Referenced Files */}
        <Card className="glassmorphism border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Most Referenced Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.mostReferencedFiles.map((file, index) => (
                <div key={file.fileName} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {file.fileName.split('/').pop()}
                      </p>
                      <p className="text-xs text-white/60">
                        {file.fileName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {file.queryCount} queries
                    </p>
                    <p className="text-xs text-white/60">
                      {file.contextUseCount} in context
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Code Generation Metrics */}
        <Card className="glassmorphism border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Code className="h-5 w-5" />
              Code Generation Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-white/80">Total Files Generated</span>
                <span className="text-lg font-bold text-white">
                  {analytics.codeGeneration.totalGenerated}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-white/80">Average Lines per Generation</span>
                <span className="text-lg font-bold text-white">
                  {Math.round(analytics.codeGeneration.avgLinesOfCode)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-sm text-green-200">Applied to Project</span>
                <span className="text-lg font-bold text-green-200">
                  {analytics.codeGeneration.totalApplied} ({Math.round(analytics.codeGeneration.applicationRate * 100)}%)
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <span className="text-sm text-yellow-200">Modified Before Use</span>
                <span className="text-lg font-bold text-yellow-200">
                  {analytics.codeGeneration.totalModified} ({Math.round((analytics.codeGeneration.totalModified / analytics.codeGeneration.totalGenerated) * 100)}%)
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <span className="text-sm text-blue-200">Average Satisfaction</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-blue-200">
                    {analytics.codeGeneration.avgSatisfaction}/5
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= analytics.codeGeneration.avgSatisfaction
                            ? 'text-yellow-400 fill-current'
                            : 'text-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Interactions */}
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Interactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentInteractions.map((interaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10">
                    {getIntentIcon(interaction.intent)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {formatIntent(interaction.intent)}
                    </p>
                    <p className="text-xs text-white/60">
                      {Math.round(interaction.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= interaction.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-white/30'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-white/60">
                      {(interaction.responseTime / 1000).toFixed(1)}s
                    </p>
                  </div>
                  
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      interaction.helpful
                        ? 'border-green-500/30 text-green-300'
                        : 'border-red-500/30 text-red-300'
                    }`}
                  >
                    {interaction.helpful ? '👍 Helpful' : '👎 Not helpful'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAnalyticsDashboard;