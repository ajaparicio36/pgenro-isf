'use client';

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, FileText, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { ChartExportManager } from '@/utils/chartExport';

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
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82ca9d',
];

const ChartViewer = ({ chartData, onClose }: ChartViewerProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const exportAsImage = async () => {
    if (!chartRef.current) {
      toast.error('Chart not found');
      return;
    }

    setIsExporting(true);
    try {
      toast.loading('Exporting chart...', { id: 'chart-export' });

      // Wait for chart to fully render
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Use SVG-to-image method exclusively
      const svgElement = chartRef.current.querySelector('svg');
      if (!svgElement) {
        throw new Error(
          'No SVG chart found. This chart type may not be supported for image export.'
        );
      }

      await exportSVGAsImage(svgElement);
    } catch (error) {
      console.error('Chart export error:', error);
      toast.dismiss('chart-export');

      let errorMessage = 'Failed to export chart. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again or contact support.';
      }

      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const exportSVGAsImage = async (svgElement: SVGElement) => {
    // Create a copy of the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true) as SVGElement;

    // Get original dimensions
    const rect = svgElement.getBoundingClientRect();
    const originalWidth = rect.width || 400;
    const originalHeight = rect.height || 300;

    // Set explicit dimensions and namespace
    svgClone.setAttribute('width', originalWidth.toString());
    svgClone.setAttribute('height', originalHeight.toString());
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.style.backgroundColor = 'white';
    svgClone.style.fontFamily = 'Arial, sans-serif';

    // Fix any problematic colors (lab, hsl, etc.)
    const elementsWithFill = svgClone.querySelectorAll(
      '[fill*="lab("], [fill*="hsl("], [fill*="oklch("]'
    );
    elementsWithFill.forEach((el, index) => {
      el.setAttribute('fill', COLORS[index % COLORS.length]);
    });

    const elementsWithStroke = svgClone.querySelectorAll(
      '[stroke*="lab("], [stroke*="hsl("], [stroke*="oklch("]'
    );
    elementsWithStroke.forEach((el, index) => {
      el.setAttribute('stroke', COLORS[index % COLORS.length]);
    });

    // Fix text colors
    const textElements = svgClone.querySelectorAll('text');
    textElements.forEach((textEl) => {
      if (
        !textEl.getAttribute('fill') ||
        textEl.getAttribute('fill')?.includes('lab(')
      ) {
        textEl.setAttribute('fill', '#000000');
      }
    });

    // Ensure paths have proper colors
    const pathElements = svgClone.querySelectorAll('path');
    pathElements.forEach((pathEl, index) => {
      if (!pathEl.getAttribute('fill') && !pathEl.getAttribute('stroke')) {
        pathEl.setAttribute('fill', COLORS[index % COLORS.length]);
      }
    });

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create canvas and draw SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(svgUrl);
      throw new Error('Canvas context not available');
    }

    // Set high resolution (2x for retina displays)
    const scale = 2;
    canvas.width = originalWidth * scale;
    canvas.height = originalHeight * scale;
    ctx.scale(scale, scale);

    // Create image and draw to canvas
    const img = new Image();

    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          // Fill white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, originalWidth, originalHeight);

          // Draw SVG image
          ctx.drawImage(img, 0, 0, originalWidth, originalHeight);

          // Convert to blob and download
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `${chartData.title
                  .toLowerCase()
                  .replace(/\s+/g, '-')}-${
                  new Date().toISOString().split('T')[0]
                }.png`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                URL.revokeObjectURL(svgUrl);

                toast.dismiss('chart-export');
                toast.success('Chart exported as image');
                resolve();
              } else {
                reject(new Error('Failed to create image blob'));
              }
            },
            'image/png',
            0.95
          );
        } catch (err) {
          URL.revokeObjectURL(svgUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(
          new Error(
            'Failed to load SVG image. The chart may contain unsupported elements.'
          )
        );
      };

      // Set a timeout for the image load
      setTimeout(() => {
        URL.revokeObjectURL(svgUrl);
        reject(
          new Error(
            'Image load timeout. Try refreshing the page and try again.'
          )
        );
      }, 10000);

      img.src = svgUrl;
    });
  };

  const exportAsCSV = () => {
    try {
      // Convert chart data to CSV format
      const headers = Object.keys(chartData.data[0] || {});
      const csvContent = [
        headers.join(','),
        ...chartData.data.map((row) =>
          headers.map((header) => `"${row[header] || ''}"`).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chartData.title
        .toLowerCase()
        .replace(/\s+/g, '-')}-data-${
        new Date().toISOString().split('T')[0]
      }.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Data exported as CSV');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export data as CSV');
    }
  };

  const exportComprehensivePDF = async () => {
    if (!chartRef.current) {
      toast.error('Chart not found');
      return;
    }

    setIsExporting(true);
    try {
      toast.loading('Generating comprehensive analysis...', {
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
      pdf.text('Chart Analysis Report', margin, yPosition);
      yPosition += 15;

      // Add generation date
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Generated on ${new Date().toLocaleString()}`,
        margin,
        yPosition
      );
      yPosition += 15;

      // Add chart title
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(chartData.title, margin, yPosition);
      yPosition += 15;

      // Capture chart image using SVG method
      toast.loading('Capturing chart...', { id: 'comprehensive-export' });
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const svgElement = chartRef.current.querySelector('svg');
      if (svgElement) {
        try {
          const imageData = await captureSVGForPDF(svgElement);
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
        } catch (error) {
          console.error('Chart capture failed:', error);
          pdf.setFontSize(10);
          pdf.setTextColor(255, 0, 0);
          pdf.text(
            '[Chart capture failed - SVG conversion error]',
            margin,
            yPosition
          );
          yPosition += 15;
        }
      } else {
        pdf.setFontSize(10);
        pdf.setTextColor(255, 0, 0);
        pdf.text('[No SVG chart found for capture]', margin, yPosition);
        yPosition += 15;
      }

      // Generate AI insights
      toast.loading('Generating AI insights...', {
        id: 'comprehensive-export',
      });

      const summaryStats = {
        totalRecords: chartData.data.length,
        dataType: chartData.dataType,
        chartType: chartData.type,
      };

      const insights = await ChartExportManager.generateChartInsights(
        chartData.title,
        chartData.type,
        chartData.dataType,
        chartData.data,
        summaryStats
      );

      // Add insights section
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('AI Analysis & Insights', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      const cleanInsights = insights
        .replace(/<[^>]*>/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1');

      const insightLines = pdf.splitTextToSize(
        cleanInsights,
        pageWidth - margin * 2
      );

      insightLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 5;
      });

      // Add data summary
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Data Summary', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(
        `Total data points: ${chartData.data.length}`,
        margin,
        yPosition
      );
      yPosition += 6;
      pdf.text(
        `Chart type: ${chartData.type.toUpperCase()}`,
        margin,
        yPosition
      );
      yPosition += 6;
      pdf.text(
        `Data category: ${chartData.dataType.replace(/_/g, ' ')}`,
        margin,
        yPosition
      );

      const fileName = `${chartData.title.toLowerCase().replace(/\s+/g, '-')}-comprehensive-analysis-${new Date().toISOString().split('T')[0]}.pdf`;

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
      toast.success('Comprehensive analysis report generated successfully!');
    } catch (error) {
      console.error('Comprehensive export error:', error);
      toast.dismiss('comprehensive-export');
      toast.error('Failed to generate comprehensive report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function for PDF capture
  const captureSVGForPDF = async (svgElement: SVGElement): Promise<string> => {
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

      // Fix colors
      const elementsWithFill = svgClone.querySelectorAll(
        '[fill*="lab("], [fill*="hsl("], [fill*="oklch("]'
      );
      elementsWithFill.forEach((el, index) => {
        el.setAttribute('fill', COLORS[index % COLORS.length]);
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
        reject(new Error('Canvas context not available'));
        return;
      }

      canvas.width = width * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = canvas.toDataURL('image/png', 0.8);
        URL.revokeObjectURL(svgUrl);
        resolve(imageData);
      };

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Failed to load SVG for PDF'));
      };

      img.src = svgUrl;
    });
  };

  const renderChart = () => {
    const { type, data, dataType } = chartData;

    const getTooltipFormatter = () => {
      if (dataType.includes('cost')) {
        return (value: any) => formatCurrency(Number(value));
      } else if (dataType.includes('area')) {
        return (value: any) => `${Number(value).toFixed(2)} ha`;
      }
      return (value: any) => formatNumber(Number(value));
    };

    const commonProps = {
      width: '100%' as const,
      height: '100%' as const,
    };

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip formatter={getTooltipFormatter()} />
              <Bar
                dataKey={
                  Object.keys(data[0] || {}).find((key) => key !== 'name') ||
                  'value'
                }
                fill="#0088FE"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={getTooltipFormatter()} />
              <Line
                type="monotone"
                dataKey="projectCount"
                stroke="#0088FE"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={getTooltipFormatter()} />
              <Area
                type="monotone"
                dataKey={
                  Object.keys(data[0] || {}).find((key) => key !== 'name') ||
                  'value'
                }
                stroke="#0088FE"
                fill="#0088FE"
                fillOpacity={0.6}
              />
            </AreaChart>
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
          <h2 className="text-2xl font-bold">{chartData.title}</h2>
          <Badge variant="secondary">AI Generated</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsCSV}
            disabled={isExporting}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsImage}
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
                Export Image
              </>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
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
                <FileText className="h-4 w-4 mr-2" />
                Comprehensive Report
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{chartData.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={chartRef}
            data-chart
            data-chart-title={chartData.title}
            className="w-full h-[400px]"
          >
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Showing {chartData.data.length} data points
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background border-b">
                <tr>
                  {Object.keys(chartData.data[0] || {}).map((key) => (
                    <th key={key} className="text-left p-2 font-medium">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.data.slice(0, 20).map((row, index) => (
                  <tr key={index} className="border-b">
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key} className="p-2">
                        {typeof value === 'number'
                          ? key.includes('cost')
                            ? formatCurrency(value)
                            : key.includes('area')
                              ? `${value.toFixed(2)} ha`
                              : formatNumber(value)
                          : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {chartData.data.length > 20 && (
              <div className="p-2 text-center text-sm text-muted-foreground">
                ... and {chartData.data.length - 20} more rows
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartViewer;
