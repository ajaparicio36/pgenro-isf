'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HeatmapCategory, HeatmapFilterData } from '@/schemas/heatmap';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useChatbot } from '@/hooks/useChatbot';
import HeatmapFilters from '@/components/heatmap/HeatmapFilters';
import HeatmapLegend from '@/components/heatmap/HeatmapLegend';
import MapComponent from '@/components/map/MapComponent';
import ChatbotButton from '@/components/chatbot/ChatbotButton';
import ChatbotInterface from '@/components/chatbot/ChatbotInterface';
import InlineReportViewer from '@/components/reports/InlineReportViewer';
import ChartViewer from '@/components/charts/ChartViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, FolderOpen, Plus, DoorOpen } from 'lucide-react';
import Link from 'next/link';
import { DASHBOARD_ROUTES } from '@/lib/routes';
import 'leaflet/dist/leaflet.css';
import { logout } from '@/actions/auth';

interface ReportItem {
  id: string;
  data: any;
  timestamp: Date;
}

interface ChartItem {
  id: string;
  data: any;
  timestamp: Date;
}

const DashboardPage = () => {
  const [filters, setFilters] = useState<HeatmapFilterData>({
    category: HeatmapCategory.RECENTNESS,
  });
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const reportRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { heatmapData, metadata, isLoading, error } = useHeatmap(filters);
  const { isOpen, toggleChatbot } = useChatbot();

  const handleFiltersChange = (newFilters: HeatmapFilterData) => {
    setFilters(newFilters);
  };

  const handleChatbotFiltersChange = (chatbotFilters: any) => {
    // Convert chatbot filters to heatmap filters format
    const newFilters: HeatmapFilterData = {
      ...filters,
      ...chatbotFilters,
    };

    // Handle custom queries
    if (chatbotFilters.customQuery) {
      console.log('Applying custom heatmap query:', chatbotFilters.customQuery);
    }

    setFilters(newFilters);
  };

  const handleReportGenerated = (newReportData: any) => {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newReport: ReportItem = {
      id: reportId,
      data: newReportData,
      timestamp: new Date(),
    };

    setReports((prev) => [...prev, newReport]);

    // Scroll to new report section after a short delay
    setTimeout(() => {
      reportRefs.current[reportId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleChartGenerated = (newChartData: any) => {
    const chartId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newChart: ChartItem = {
      id: chartId,
      data: newChartData,
      timestamp: new Date(),
    };

    setCharts((prev) => [...prev, newChart]);

    // Scroll to new chart section after a short delay
    setTimeout(() => {
      chartRefs.current[chartId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleCloseReport = (reportId: string) => {
    setReports((prev) => prev.filter((report) => report.id !== reportId));
    delete reportRefs.current[reportId];
  };

  const handleCloseChart = (chartId: string) => {
    setCharts((prev) => prev.filter((chart) => chart.id !== chartId));
    delete chartRefs.current[chartId];
  };

  const handleCloseAllReports = () => {
    setReports([]);
    reportRefs.current = {};
  };

  const handleCloseAllCharts = () => {
    setCharts([]);
    chartRefs.current = {};
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Project Heatmap Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visualize project distribution and intensity across barangays. Ask
            AI for insights!
          </p>
        </div>
        <div className="flex items-center gap-2 flex-col md:flex-row">
          <Link href={DASHBOARD_ROUTES.projects}>
            <Button variant="outline">
              <FolderOpen className="h-4 w-4 mr-2" />
              View Projects
            </Button>
          </Link>
          <Link href={DASHBOARD_ROUTES.stewards}>
            <Button variant="outline">
              <FolderOpen className="h-4 w-4 mr-2" />
              View Stewards
            </Button>
          </Link>
          <Link href={DASHBOARD_ROUTES.forms}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </Link>
          <Link href={DASHBOARD_ROUTES.createSteward}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Steward
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={toggleChatbot}
            className="hidden md:flex"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          <Button variant="destructive" className="" onClick={logout}>
            <DoorOpen className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Failed to load heatmap data. Please try again later.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4 lg:max-h-[650px] lg:overflow-y-auto">
          <HeatmapFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          <HeatmapLegend category={filters.category} metadata={metadata} />
        </div>

        <div className="lg:col-span-3">
          <MapComponent heatmapData={heatmapData} isLoading={isLoading} />
        </div>
      </div>

      {/* Summary Statistics */}
      {metadata && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {metadata.totalBarangays}
              </div>
              <p className="text-sm text-muted-foreground">Total Barangays</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {metadata.dateRange.earliest} - {metadata.dateRange.latest}
              </div>
              <p className="text-sm text-muted-foreground">Date Range</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {heatmapData.reduce(
                  (sum, point) => sum + point.projectCount,
                  0
                )}
              </div>
              <p className="text-sm text-muted-foreground">Total Projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-lg font-bold">
                {metadata.valueRange.min.toFixed(0)} -{' '}
                {metadata.valueRange.max.toFixed(0)}
              </div>
              <p className="text-sm text-muted-foreground">Value Range</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Multiple Chart Viewers */}
      {charts.length > 0 && (
        <>
          {charts.length > 1 && (
            <div className="flex items-center justify-between border-t pt-6">
              <h2 className="text-xl font-semibold">
                Generated Charts ({charts.length})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseAllCharts}
              >
                <X className="h-4 w-4 mr-2" />
                Close All Charts
              </Button>
            </div>
          )}
          {charts.map((chart) => (
            <div
              key={chart.id}
              ref={(el) => {
                reportRefs.current[chart.id] = el;
              }}
            >
              <ChartViewer
                chartData={chart.data}
                onClose={() => handleCloseChart(chart.id)}
              />
            </div>
          ))}
        </>
      )}

      {/* Multiple Inline Report Viewers */}
      {reports.length > 0 && (
        <>
          {reports.length > 1 && (
            <div className="flex items-center justify-between border-t pt-6">
              <h2 className="text-xl font-semibold">
                Generated Reports ({reports.length})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseAllReports}
              >
                <X className="h-4 w-4 mr-2" />
                Close All Reports
              </Button>
            </div>
          )}
          {reports.map((report) => (
            <div
              key={report.id}
              ref={(el) => {
                reportRefs.current[report.id] = el;
              }}
            >
              <InlineReportViewer
                reportData={report.data}
                onClose={() => handleCloseReport(report.id)}
              />
            </div>
          ))}
        </>
      )}

      {/* Chatbot Components */}
      <ChatbotButton isOpen={isOpen} onClick={toggleChatbot} />

      {isOpen && (
        <ChatbotInterface
          onFiltersChange={handleChatbotFiltersChange}
          onReportGenerated={handleReportGenerated}
          onChartGenerated={handleChartGenerated}
          onClose={toggleChatbot}
        />
      )}
    </div>
  );
};

export default DashboardPage;
