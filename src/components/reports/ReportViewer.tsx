'use client';

import React, { useRef } from 'react';
import { ReportData } from '@/schemas/report';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  DollarSign,
  MapPin,
  Calendar,
} from 'lucide-react';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface ReportViewerProps {
  reportData: ReportData;
  onBack: () => void;
  onClose: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportViewer = ({ reportData, onBack, onClose }: ReportViewerProps) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async (includeAI = false) => {
    if (!reportRef.current) return;

    try {
      toast.loading('Generating PDF...');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // Add title
      pdf.setFontSize(20);
      pdf.text('Project Report', margin, margin + 10);

      // Add summary
      pdf.setFontSize(12);
      let yPosition = margin + 30;

      pdf.text('Summary Statistics', margin, yPosition);
      yPosition += 10;

      pdf.text(
        `Total Projects: ${reportData.summary.totalProjects}`,
        margin,
        yPosition
      );
      yPosition += 6;
      pdf.text(
        `Total Cost: ₱${reportData.summary.totalCost.toLocaleString()}`,
        margin,
        yPosition
      );
      yPosition += 6;
      pdf.text(
        `Total Area: ${reportData.summary.totalAreaDeveloped.toFixed(2)} hectares`,
        margin,
        yPosition
      );
      yPosition += 6;
      pdf.text(
        `Average Cost: ₱${reportData.summary.averageProjectCost.toLocaleString()}`,
        margin,
        yPosition
      );
      yPosition += 15;

      // Capture charts
      const chartElements = reportRef.current.querySelectorAll('[data-chart]');

      for (let i = 0; i < chartElements.length; i++) {
        const element = chartElements[i] as HTMLElement;

        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin;
        }

        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true,
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - margin * 2;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
        } catch (error) {
          console.warn('Failed to capture chart:', error);
        }
      }

      // Add AI analysis if requested
      if (includeAI && reportData.aiAnalysis) {
        pdf.addPage();
        yPosition = margin;

        pdf.setFontSize(16);
        pdf.text('AI Analysis', margin, yPosition);
        yPosition += 15;

        pdf.setFontSize(10);
        const splitText = pdf.splitTextToSize(
          reportData.aiAnalysis,
          pageWidth - margin * 2
        );

        for (const line of splitText) {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 5;
        }
      }

      pdf.save('project-report.pdf');
      toast.dismiss();
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-6 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Project Report</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToPDF(false)}>
            <Download className="h-4 w-4 mr-2" />
            Export Charts
          </Button>
          <Button variant="outline" onClick={() => exportToPDF(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Full Report
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div ref={reportRef} className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.summary.totalProjects}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{reportData.summary.totalCost.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Total Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.summary.totalAreaDeveloped.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">hectares</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Average Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{reportData.summary.averageProjectCost.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="municipality" className="space-y-4">
            <TabsList>
              <TabsTrigger value="municipality">By Municipality</TabsTrigger>
              <TabsTrigger value="yearly">By Year</TabsTrigger>
              <TabsTrigger value="status">By Status</TabsTrigger>
            </TabsList>

            <TabsContent value="municipality" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Count by Municipality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-chart className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.municipalityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="municipalityName"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="projectCount" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Cost by Municipality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-chart className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.municipalityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="municipalityName"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) =>
                              `₱${Number(value).toLocaleString()}`
                            }
                          />
                          <Bar dataKey="totalCost" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="yearly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Projects Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div data-chart className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="projectCount"
                          stroke="#8884d8"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-chart className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData.statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ status, count }) => `${status}: ${count}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {reportData.statusData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.statusData.map((item, index) => (
                        <div
                          key={item.status}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                            <Badge variant="outline">{item.status}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {item.count} projects
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ₱{item.totalCost.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* AI Analysis */}
          {reportData.aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  AI Analysis & Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: reportData.aiAnalysis.replace(/\n/g, '<br />'),
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ReportViewer;
