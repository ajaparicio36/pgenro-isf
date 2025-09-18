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
import { MessageCircle, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const DashboardPage = () => {
  const [filters, setFilters] = useState<HeatmapFilterData>({
    category: HeatmapCategory.RECENTNESS,
  });
  const [reportData, setReportData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

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
      // For custom queries, we need to pass the custom parameters to the heatmap API
      // This will be handled by the useHeatmap hook
      console.log('Applying custom heatmap query:', chatbotFilters.customQuery);
    }

    setFilters(newFilters);
  };

  const handleReportGenerated = (newReportData: any) => {
    setReportData(newReportData);

    // Scroll to report section after a short delay
    setTimeout(() => {
      reportRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleChartGenerated = (newChartData: any) => {
    setChartData(newChartData);

    // Scroll to chart section after a short delay
    setTimeout(() => {
      chartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleCloseReport = () => {
    setReportData(null);
  };

  const handleCloseChart = () => {
    setChartData(null);
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
        <Button
          variant="outline"
          onClick={toggleChatbot}
          className="hidden md:flex"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
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

      {/* Inline Chart Viewer */}
      {chartData && (
        <div ref={chartRef}>
          <ChartViewer chartData={chartData} onClose={handleCloseChart} />
        </div>
      )}

      {/* Inline Report Viewer */}
      {reportData && (
        <div ref={reportRef}>
          <InlineReportViewer
            reportData={reportData}
            onClose={handleCloseReport}
          />
        </div>
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
