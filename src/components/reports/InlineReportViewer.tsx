'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, FileText } from 'lucide-react';
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
} from 'recharts';

interface ReportData {
  summary: {
    totalProjects: number;
    totalCost: number;
    totalAreaDeveloped: number;
    averageProjectCost: number;
  };
  municipalityData?: Array<{
    municipalityId: string;
    municipalityName: string;
    projectCount: number;
    totalCost: number;
    totalAreaDeveloped: number;
    averageProjectCost: number;
  }>;
  yearlyData?: Array<{
    year: string;
    projectCount: number;
    totalCost: number;
    totalAreaDeveloped: number;
  }>;
  statusData?: Array<{
    status: string;
    count: number;
    totalCost: number;
  }>;
  aiAnalysis?: string;
}

interface InlineReportViewerProps {
  reportData: ReportData;
  onClose: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const InlineReportViewer = ({
  reportData,
  onClose,
}: InlineReportViewerProps) => {
  const {
    summary,
    municipalityData = [],
    yearlyData = [],
    statusData = [],
    aiAnalysis,
  } = reportData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6 mt-8 border-t pt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Generated Report</h2>
          <Badge variant="secondary">AI Generated</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary.totalProjects)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalCost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Area Developed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalAreaDeveloped.toFixed(1)} ha
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Project Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.averageProjectCost)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Municipality Distribution */}
        {municipalityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projects by Municipality</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={municipalityData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="municipalityName"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'projectCount'
                        ? value
                        : formatCurrency(value as number),
                      name === 'projectCount' ? 'Projects' : 'Total Cost',
                    ]}
                  />
                  <Bar dataKey="projectCount" fill="#3b82f6" name="Projects" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Yearly Trends */}
        {yearlyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Yearly Project Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'projectCount'
                        ? value
                        : formatCurrency(value as number),
                      name === 'projectCount' ? 'Projects' : 'Total Cost',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectCount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Projects"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalCost"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Total Cost"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Status Distribution */}
        {statusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Cost Analysis */}
        {municipalityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cost by Municipality</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={municipalityData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="municipalityName"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Bar dataKey="totalCost" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Analysis */}
      {aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>AI Analysis</span>
              <Badge variant="secondary">Generated by AI</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none text-sm"
              dangerouslySetInnerHTML={{
                __html: aiAnalysis.replace(/\n/g, '<br />'),
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InlineReportViewer;
