'use client';

import React, { useRef, useState } from 'react';
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
  Loader2,
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
import { ChartExportManager } from '@/utils/chartExport';

interface ReportViewerProps {
  reportData: ReportData;
  onBack: () => void;
  onClose: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportViewer = ({ reportData, onBack, onClose }: ReportViewerProps) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async (includeAI = false) => {
    if (!reportRef.current) {
      toast.error('Report content not found');
      return;
    }

    setIsExporting(true);
    console.log('Starting PDF export...');

    try {
      toast.loading('Preparing export...', { id: 'pdf-export' });

      // Import jsPDF dynamically to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Add header
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Project Report', margin, yPosition);
      yPosition += 15;

      // Add generation date
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Generated on ${new Date().toLocaleString()}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Executive Summary
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Executive Summary', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      const summaryItems = [
        `Total Projects: ${reportData.summary.totalProjects}`,
        `Total Cost: ₱${reportData.summary.totalCost.toLocaleString()}`,
        `Total Area: ${reportData.summary.totalAreaDeveloped.toFixed(2)} hectares`,
        `Average Cost: ₱${reportData.summary.averageProjectCost.toLocaleString()}`,
      ];

      summaryItems.forEach((item) => {
        pdf.text(item, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 15;

      // Capture charts using SVG method
      const chartElements = reportRef.current.querySelectorAll('[data-chart]');
      console.log(`Found ${chartElements.length} charts to capture`);

      for (let i = 0; i < chartElements.length; i++) {
        const chartContainer = chartElements[i] as HTMLElement;
        const chartTitle =
          chartContainer.getAttribute('data-chart-title') || `Chart ${i + 1}`;

        console.log(`Capturing chart ${i + 1}: ${chartTitle}`);

        // Check if we need a new page
        if (yPosition > pageHeight - 120) {
          pdf.addPage();
          yPosition = margin;
        }

        // Add chart title
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text(chartTitle, margin, yPosition);
        yPosition += 10;

        try {
          // Wait for chart to render completely
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Use SVG capture method exclusively
          const svgElement = chartContainer.querySelector('svg');
          if (svgElement) {
            const imageData = await captureSVGForReportPDF(svgElement);
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = Math.min(imgWidth * 0.6, 120);

            pdf.addImage(
              imageData,
              'PNG',
              margin,
              yPosition,
              imgWidth,
              imgHeight
            );
            yPosition += imgHeight + 15;
            console.log(`Chart ${i + 1} added to PDF successfully`);
          } else {
            console.warn(`Chart ${i + 1} has no SVG element`);
            pdf.setFontSize(10);
            pdf.setTextColor(255, 0, 0);
            pdf.text(
              `[Chart capture failed: No SVG found - ${chartTitle}]`,
              margin,
              yPosition
            );
            yPosition += 15;
          }
        } catch (error) {
          console.error(`Failed to capture chart "${chartTitle}":`, error);
          pdf.setFontSize(10);
          pdf.setTextColor(255, 0, 0);
          pdf.text(`[Chart export failed: ${chartTitle}]`, margin, yPosition);
          yPosition += 15;
        }
      }

      // Add AI analysis if requested
      if (includeAI && reportData.aiAnalysis) {
        console.log('Adding AI analysis...');
        pdf.addPage();
        yPosition = margin;

        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('AI Analysis & Insights', margin, yPosition);
        yPosition += 15;

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);

        // Clean up the analysis text
        const cleanAnalysis = reportData.aiAnalysis
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
          .replace(/\*(.*?)\*/g, '$1'); // Remove markdown italic

        const splitText = pdf.splitTextToSize(
          cleanAnalysis,
          pageWidth - margin * 2
        );

        splitText.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 5;
        });
      }

      console.log('Generating PDF file...');
      toast.loading('Generating file...', { id: 'pdf-export' });

      // Generate and save the PDF
      const fileName = `project-report-${new Date().toISOString().split('T')[0]}.pdf`;

      // Try different save methods for better compatibility
      try {
        pdf.save(fileName);
        console.log('PDF saved successfully');
      } catch (saveError) {
        console.error('Save error:', saveError);

        // Fallback: create blob and download manually
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('PDF saved using fallback method');
      }

      toast.dismiss('pdf-export');
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.dismiss('pdf-export');

      // Provide more specific error message
      let errorMessage = 'Failed to export PDF. ';
      if (error instanceof Error) {
        if (error.message.includes('SVG')) {
          errorMessage +=
            'Chart SVG conversion failed. Try refreshing the page.';
        } else if (error.message.includes('jsPDF')) {
          errorMessage += 'PDF generation failed. Try a different browser.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }

      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
      console.log('PDF export process completed');
    }
  };

  const exportComprehensivePDF = async () => {
    if (!reportRef.current) {
      toast.error('Report content not found');
      return;
    }

    setIsExporting(true);
    console.log('Starting comprehensive PDF export...');

    try {
      toast.loading('Preparing comprehensive analysis...', {
        id: 'comprehensive-export',
      });

      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Add header
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Comprehensive Project Analysis Report', margin, yPosition);
      yPosition += 15;

      // Add generation date and summary
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Generated on ${new Date().toLocaleString()}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Executive Summary
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Executive Summary', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      const summaryItems = [
        `Total Projects: ${reportData.summary.totalProjects || 0}`,
        `Total Cost: ₱${(reportData.summary.totalCost || 0).toLocaleString()}`,
        `Total Area: ${(reportData.summary.totalAreaDeveloped || 0).toFixed(2)} hectares`,
        `Average Cost: ₱${(reportData.summary.averageProjectCost || 0).toLocaleString()}`,
      ];

      summaryItems.forEach((item) => {
        pdf.text(item, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 15;

      // Define all available chart data for comprehensive analysis
      const allChartData = [
        {
          title: 'Projects by Municipality',
          data: reportData.municipalityData || [],
          type: 'bar' as const,
          dataType: 'projects_by_municipality',
        },
        {
          title: 'Projects Over Time',
          data: reportData.yearlyData || [],
          type: 'line' as const,
          dataType: 'projects_by_year',
        },
        {
          title: 'Project Status Distribution',
          data: reportData.statusData || [],
          type: 'pie' as const,
          dataType: 'status_distribution',
        },
        {
          title: 'Total Cost by Municipality',
          data: reportData.municipalityData || [],
          type: 'bar' as const,
          dataType: 'cost_by_municipality',
        },
      ].filter((chart) => chart.data.length > 0);

      // Get all chart elements
      const chartElements = reportRef.current.querySelectorAll('[data-chart]');

      // Process each chart with insights using improved method
      for (
        let i = 0;
        i < chartElements.length && i < allChartData.length;
        i++
      ) {
        const chartContainer = chartElements[i] as HTMLElement;
        const chartInfo = allChartData[i];

        console.log(`Processing chart ${i + 1}: ${chartInfo.title}`);

        // Check if we need a new page
        if (yPosition > pageHeight - 150) {
          pdf.addPage();
          yPosition = margin;
        }

        // Add chart title
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${i + 1}. ${chartInfo.title}`, margin, yPosition);
        yPosition += 12;

        try {
          // Generate insights
          toast.loading(`Analyzing ${chartInfo.title.toLowerCase()}...`, {
            id: 'comprehensive-export',
          });

          const insights = await ChartExportManager.generateChartInsights(
            chartInfo.title,
            chartInfo.type,
            chartInfo.dataType,
            chartInfo.data,
            reportData.summary
          );

          // Capture chart using SVG method
          toast.loading(`Capturing ${chartInfo.title.toLowerCase()}...`, {
            id: 'comprehensive-export',
          });
          await new Promise((resolve) => setTimeout(resolve, 1500));

          const svgElement = chartContainer.querySelector('svg');
          if (svgElement) {
            const imageDataUrl = await captureSVGForReportPDF(svgElement);
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = Math.min(imgWidth * 0.6, 120);

            pdf.addImage(
              imageDataUrl,
              'PNG',
              margin,
              yPosition,
              imgWidth,
              imgHeight
            );
            yPosition += imgHeight + 10;
          } else {
            pdf.setFontSize(10);
            pdf.setTextColor(255, 0, 0);
            pdf.text(
              `[No SVG chart found: ${chartInfo.title}]`,
              margin,
              yPosition
            );
            yPosition += 15;
          }

          // Add insights
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Key Insights & Analysis:', margin, yPosition);
          yPosition += 8;

          pdf.setFontSize(10);
          pdf.setTextColor(60, 60, 60);

          const cleanInsights = insights
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/^\d+\.\s*/gm, '• ');

          const insightLines = pdf.splitTextToSize(
            cleanInsights,
            pageWidth - margin * 2
          );

          insightLines.forEach((line: string) => {
            if (yPosition > pageHeight - margin * 2) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(line, margin, yPosition);
            yPosition += 4;
          });

          yPosition += 10;
        } catch (error) {
          console.error(`Failed to process chart "${chartInfo.title}":`, error);
          pdf.setFontSize(10);
          pdf.setTextColor(255, 0, 0);
          pdf.text(
            `[Chart analysis failed: ${chartInfo.title}]`,
            margin,
            yPosition
          );
          yPosition += 15;
        }
      }

      // Add overall AI analysis if available
      if (reportData.aiAnalysis) {
        pdf.addPage();
        yPosition = margin;

        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Overall Strategic Analysis', margin, yPosition);
        yPosition += 15;

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);

        const cleanAnalysis = reportData.aiAnalysis
          .replace(/<[^>]*>/g, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1');

        const splitText = pdf.splitTextToSize(
          cleanAnalysis,
          pageWidth - margin * 2
        );

        splitText.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 5;
        });
      }

      const fileName = `comprehensive-project-analysis-${new Date().toISOString().split('T')[0]}.pdf`;

      try {
        pdf.save(fileName);
      } catch (saveError) {
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.dismiss('comprehensive-export');
      toast.success(
        `Comprehensive analysis report with ${allChartData.length} charts exported successfully!`
      );
    } catch (error) {
      console.error('Comprehensive PDF export error:', error);
      toast.dismiss('comprehensive-export');
      toast.error('Failed to export comprehensive report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function for SVG capture in reports
  const captureSVGForReportPDF = async (
    svgElement: SVGElement
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const svgClone = svgElement.cloneNode(true) as SVGElement;
      const rect = svgElement.getBoundingClientRect();
      const width = rect.width || 400;
      const height = rect.height || 300;

      // Prepare SVG for PDF
      svgClone.setAttribute('width', width.toString());
      svgClone.setAttribute('height', height.toString());
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgClone.style.backgroundColor = 'white';
      svgClone.style.fontFamily = 'Arial, sans-serif';

      // Fix colors - handle multiple problematic color formats
      const elementsWithProblematicFill = svgClone.querySelectorAll(
        '[fill*="lab("], [fill*="hsl("], [fill*="oklch("], [fill*="color("]'
      );
      elementsWithProblematicFill.forEach((el, index) => {
        el.setAttribute('fill', COLORS[index % COLORS.length]);
      });

      const elementsWithProblematicStroke = svgClone.querySelectorAll(
        '[stroke*="lab("], [stroke*="hsl("], [stroke*="oklch("], [stroke*="color("]'
      );
      elementsWithProblematicStroke.forEach((el, index) => {
        el.setAttribute('stroke', COLORS[index % COLORS.length]);
      });

      // Fix text elements
      const textElements = svgClone.querySelectorAll('text');
      textElements.forEach((textEl) => {
        if (
          !textEl.getAttribute('fill') ||
          textEl.getAttribute('fill')?.includes('lab(')
        ) {
          textEl.setAttribute('fill', '#000000');
        }
      });

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Canvas context not available for SVG conversion'));
        return;
      }

      canvas.width = width * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);

      const img = new Image();
      img.onload = () => {
        try {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const imageData = canvas.toDataURL('image/png', 0.8);
          URL.revokeObjectURL(svgUrl);
          resolve(imageData);
        } catch (drawError) {
          URL.revokeObjectURL(svgUrl);
          reject(new Error(`Canvas drawing failed: ${drawError}`));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Failed to load SVG image for PDF conversion'));
      };

      // Add timeout for SVG loading
      setTimeout(() => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('SVG to image conversion timeout'));
      }, 8000);

      img.src = svgUrl;
    });
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
          <Button
            variant="outline"
            onClick={() => exportToPDF(false)}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Charts
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportToPDF(true)}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Full Report
              </>
            )}
          </Button>
          <Button
            variant="default"
            onClick={exportComprehensivePDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Comprehensive Analysis
              </>
            )}
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
                    <div
                      data-chart
                      data-chart-title="Project Count by Municipality"
                      className="h-80"
                    >
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
                    <div
                      data-chart
                      data-chart-title="Total Cost by Municipality"
                      className="h-80"
                    >
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
                  <div
                    data-chart
                    data-chart-title="Projects Over Time"
                    className="h-80"
                  >
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
                    <div
                      data-chart
                      data-chart-title="Project Status Distribution"
                      className="h-80"
                    >
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
