'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, BarChart3 } from 'lucide-react';
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area';
  dataType: string;
  data: any[];
  title: string;
}

interface ChartViewerProps {
  chartData: ChartData;
  onClose: () => void;
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316',
];

const ChartViewer = ({ chartData, onClose }: ChartViewerProps) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `₱${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `₱${(value / 1000).toFixed(1)}K`;
    }
    return `₱${value.toLocaleString()}`;
  };

  const formatArea = (value: number) => {
    return `${value.toFixed(1)} ha`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const getTooltipFormatter = () => {
    switch (chartData.dataType) {
      case 'cost_by_municipality':
      case 'cost_by_barangay':
        return (value: number) => [formatCurrency(value), 'Total Cost'];
      case 'area_by_barangay':
        return (value: number) => [formatArea(value), 'Area Developed'];
      case 'projects_by_municipality':
      case 'projects_by_year':
        return (value: number) => [formatNumber(value), 'Projects'];
      case 'status_distribution':
        return (value: number) => [formatNumber(value), 'Count'];
      default:
        return (value: number) => [value, 'Value'];
    }
  };

  const getDataKey = () => {
    switch (chartData.dataType) {
      case 'cost_by_municipality':
      case 'cost_by_barangay':
        return 'totalCost';
      case 'area_by_barangay':
        return 'totalArea';
      case 'projects_by_municipality':
      case 'projects_by_year':
        return 'projectCount';
      case 'status_distribution':
        return 'count';
      default:
        return 'value';
    }
  };

  const getNameKey = () => {
    switch (chartData.dataType) {
      case 'projects_by_year':
        return 'year';
      case 'status_distribution':
        return 'status';
      default:
        return 'name';
    }
  };

  const renderChart = () => {
    const dataKey = getDataKey();
    const nameKey = getNameKey();
    const tooltipFormatter = getTooltipFormatter();

    switch (chartData.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={nameKey}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis fontSize={12} />
              <Tooltip formatter={tooltipFormatter} />
              <Bar dataKey={dataKey} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={tooltipFormatter} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={chartData.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={tooltipFormatter} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ [nameKey]: name, [dataKey]: value }) =>
                  `${name}: ${tooltipFormatter(value)[0]}`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey={dataKey}
              >
                {chartData.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="space-y-6 mt-8 border-t pt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{chartData.title}</h2>
          <Badge variant="secondary">AI Generated</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Chart
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{chartData.title}</span>
            <Badge variant="outline" className="capitalize">
              {chartData.type} Chart
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>{renderChart()}</CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{chartData.data.length}</div>
              <p className="text-sm text-muted-foreground">Data Points</p>
            </div>
            {chartData.dataType.includes('cost') && (
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    chartData.data.reduce(
                      (sum, item) => sum + (item.totalCost || 0),
                      0
                    )
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
              </div>
            )}
            {chartData.dataType.includes('area') && (
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatArea(
                    chartData.data.reduce(
                      (sum, item) => sum + (item.totalArea || 0),
                      0
                    )
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Total Area</p>
              </div>
            )}
            {chartData.dataType.includes('projects') && (
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatNumber(
                    chartData.data.reduce(
                      (sum, item) => sum + (item.projectCount || 0),
                      0
                    )
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartViewer;
