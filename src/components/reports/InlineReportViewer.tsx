'use client';

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, FileText, Loader2, BarChart3 } from 'lucide-react';
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
import { toast } from 'sonner';
import { ChartExportManager } from '@/utils/chartExport';

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

  const reportRef = useRef<HTMLDivElement>(null);
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
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      console.log('PDF initialized, adding header...');

      // Add header
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Project Report', margin, yPosition);
      yPosition += 15;

      // Add generation date
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()}`,
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
        `Total Projects: ${formatNumber(summary.totalProjects)}`,
        `Total Investment: ${formatCurrency(summary.totalCost)}`,
        `Area Developed: ${summary.totalAreaDeveloped.toFixed(1)} hectares`,
        `Average Project Cost: ${formatCurrency(summary.averageProjectCost)}`,
      ];

      summaryItems.forEach((item) => {
        pdf.text(item, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 15;

      console.log('Summary added, capturing charts...');
      toast.loading('Capturing charts...', { id: 'pdf-export' });

      // Capture and add charts
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
          // Wait for chart to fully render
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Force re-render of recharts components with standard colors
          const rechartsSvgs =
            chartContainer.querySelectorAll('.recharts-surface');
          const rechartElements = chartContainer.querySelectorAll(
            '[fill*="lab("], [stroke*="lab("]'
          );

          // Replace any lab colors with standard colors
          rechartElements.forEach((element, index) => {
            const htmlElement = element as HTMLElement;
            if (htmlElement.getAttribute('fill')?.includes('lab(')) {
              htmlElement.setAttribute('fill', COLORS[index % COLORS.length]);
            }
            if (htmlElement.getAttribute('stroke')?.includes('lab(')) {
              htmlElement.setAttribute('stroke', COLORS[index % COLORS.length]);
            }
          });

          rechartsSvgs.forEach((svg) => {
            (svg as any).style.backgroundColor = 'white';
          });

          const canvas = await html2canvas(chartContainer, {
            scale: 1.5,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: chartContainer.offsetWidth,
            height: chartContainer.offsetHeight,
            foreignObjectRendering: false,
            imageTimeout: 15000,
            removeContainer: false,
            ignoreElements: (element) => {
              // Skip elements with unsupported CSS features
              const style = getComputedStyle(element);
              return Boolean(
                style.color?.includes('lab(') ||
                  style.backgroundColor?.includes('lab(') ||
                  (element as HTMLElement)
                    .getAttribute('fill')
                    ?.includes('lab(') ||
                  (element as HTMLElement)
                    .getAttribute('stroke')
                    ?.includes('lab(')
              );
            },
            onclone: (clonedDoc) => {
              // Clean up colors in cloned document
              const clonedElements = clonedDoc.querySelectorAll('*');
              clonedElements.forEach((el) => {
                const htmlEl = el as HTMLElement;

                // Replace lab colors with standard hex colors
                if (htmlEl.style.color?.includes('lab(')) {
                  htmlEl.style.color = '#000000';
                }
                if (htmlEl.style.backgroundColor?.includes('lab(')) {
                  htmlEl.style.backgroundColor = '#ffffff';
                }
                if (htmlEl.getAttribute('fill')?.includes('lab(')) {
                  htmlEl.setAttribute('fill', '#0088FE');
                }
                if (htmlEl.getAttribute('stroke')?.includes('lab(')) {
                  htmlEl.setAttribute('stroke', '#0088FE');
                }
              });
            },
          });

          console.log(
            `Chart ${i + 1} canvas size: ${canvas.width}x${canvas.height}`
          );

          if (canvas.width > 0 && canvas.height > 0) {
            const imgData = canvas.toDataURL('image/png', 0.8);
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = Math.min(
              (canvas.height * imgWidth) / canvas.width,
              120
            );

            pdf.addImage(
              imgData,
              'PNG',
              margin,
              yPosition,
              imgWidth,
              imgHeight
            );
            yPosition += imgHeight + 15;
            console.log(`Chart ${i + 1} added to PDF successfully`);
          } else {
            console.warn(`Chart ${i + 1} has invalid canvas dimensions`);
            pdf.setFontSize(10);
            pdf.setTextColor(255, 0, 0);
            pdf.text(
              `[Chart capture failed: ${chartTitle}]`,
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

      // Add AI analysis if requested and available
      if (includeAI && aiAnalysis) {
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
        const cleanAnalysis = aiAnalysis
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
        if (error.message.includes('html2canvas')) {
          errorMessage += 'Chart capture failed. Try refreshing the page.';
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
      toast.loading('Preparing comprehensive export...', {
        id: 'comprehensive-export',
      });

      // Import jsPDF dynamically
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
        `Total Projects: ${formatNumber(summary.totalProjects)}`,
        `Total Investment: ${formatCurrency(summary.totalCost)}`,
        `Area Developed: ${summary.totalAreaDeveloped.toFixed(1)} hectares`,
        `Average Project Cost: ${formatCurrency(summary.averageProjectCost)}`,
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
          data: municipalityData,
          type: 'bar' as const,
          dataType: 'projects_by_municipality',
        },
        {
          title: 'Yearly Project Trends',
          data: yearlyData,
          type: 'line' as const,
          dataType: 'projects_by_year',
        },
        {
          title: 'Project Status Distribution',
          data: statusData,
          type: 'pie' as const,
          dataType: 'status_distribution',
        },
        {
          title: 'Total Cost by Municipality',
          data: municipalityData,
          type: 'bar' as const,
          dataType: 'cost_by_municipality',
        },
        {
          title: 'Area Developed by Municipality',
          data: municipalityData,
          type: 'bar' as const,
          dataType: 'area_by_municipality',
        },
      ].filter((chart) => chart.data && chart.data.length > 0);

      // Get all chart elements
      const chartElements = reportRef.current.querySelectorAll('[data-chart]');
      console.log(`Processing ${chartElements.length} charts with insights...`);

      // Process each available chart with insights
      for (
        let i = 0;
        i < Math.min(chartElements.length, allChartData.length);
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
          // Generate insights for this chart
          toast.loading(`Analyzing ${chartInfo.title.toLowerCase()}...`, {
            id: 'comprehensive-export',
          });

          const insights = await generateInsights(
            chartInfo.title,
            chartInfo.data,
            chartInfo.type,
            chartInfo.dataType
          );

          // Capture chart image
          toast.loading(`Capturing ${chartInfo.title.toLowerCase()}...`, {
            id: 'comprehensive-export',
          });
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Use html2canvas for chart capture
          const html2canvas = (await import('html2canvas')).default;

          // Clean up any problematic colors before capture
          const rechartElements = chartContainer.querySelectorAll(
            '[fill*="lab("], [stroke*="lab("], [fill*="hsl("], [stroke*="hsl("]'
          );
          rechartElements.forEach((element, index) => {
            const htmlElement = element as HTMLElement;
            if (
              htmlElement.getAttribute('fill')?.includes('lab(') ||
              htmlElement.getAttribute('fill')?.includes('hsl(')
            ) {
              htmlElement.setAttribute('fill', COLORS[index % COLORS.length]);
            }
            if (
              htmlElement.getAttribute('stroke')?.includes('lab(') ||
              htmlElement.getAttribute('stroke')?.includes('hsl(')
            ) {
              htmlElement.setAttribute('stroke', COLORS[index % COLORS.length]);
            }
          });

          const canvas = await html2canvas(chartContainer, {
            scale: 1.5,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            foreignObjectRendering: false,
            removeContainer: false,
            onclone: (clonedDoc) => {
              // Clean up colors in cloned document
              const clonedElements = clonedDoc.querySelectorAll('*');
              clonedElements.forEach((el) => {
                const htmlEl = el as HTMLElement;

                // Replace problematic colors with standard hex colors
                if (
                  htmlEl.style.color?.includes('lab(') ||
                  htmlEl.style.color?.includes('hsl(')
                ) {
                  htmlEl.style.color = '#000000';
                }
                if (
                  htmlEl.style.backgroundColor?.includes('lab(') ||
                  htmlEl.style.backgroundColor?.includes('hsl(')
                ) {
                  htmlEl.style.backgroundColor = '#ffffff';
                }
                if (
                  htmlEl.getAttribute('fill')?.includes('lab(') ||
                  htmlEl.getAttribute('fill')?.includes('hsl(')
                ) {
                  htmlEl.setAttribute('fill', '#0088FE');
                }
                if (
                  htmlEl.getAttribute('stroke')?.includes('lab(') ||
                  htmlEl.getAttribute('stroke')?.includes('hsl(')
                ) {
                  htmlEl.setAttribute('stroke', '#0088FE');
                }
              });
            },
          });

          if (canvas.width > 0 && canvas.height > 0) {
            const imageDataUrl = canvas.toDataURL('image/png', 0.8);

            // Add chart image
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

          yPosition += 15;

          console.log(`Chart ${i + 1} processed successfully`);
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

      // Add comprehensive data analysis section
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Comprehensive Data Analysis', margin, yPosition);
      yPosition += 15;

      // Add cross-chart insights
      try {
        toast.loading('Generating cross-chart analysis...', {
          id: 'comprehensive-export',
        });

        const crossChartInsights = await generateCrossChartInsights();

        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        const crossInsightLines = pdf.splitTextToSize(
          crossChartInsights,
          pageWidth - margin * 2
        );

        crossInsightLines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 4;
        });
      } catch (error) {
        console.error('Cross-chart analysis failed:', error);
        pdf.setFontSize(10);
        pdf.setTextColor(255, 0, 0);
        pdf.text('[Cross-chart analysis unavailable]', margin, yPosition);
        yPosition += 10;
      }

      // Add AI Analysis if available
      if (aiAnalysis) {
        pdf.addPage();
        yPosition = margin;

        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Overall AI Analysis & Strategic Insights', margin, yPosition);
        yPosition += 15;

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);

        const cleanAnalysis = aiAnalysis
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

      console.log('Generating comprehensive PDF file...');
      toast.loading('Finalizing comprehensive report...', {
        id: 'comprehensive-export',
      });

      // Generate and save the PDF
      const fileName = `comprehensive-project-analysis-${new Date().toISOString().split('T')[0]}.pdf`;

      try {
        pdf.save(fileName);
        console.log('Comprehensive PDF saved successfully');
      } catch (saveError) {
        console.error('Save error:', saveError);
        // Fallback save method
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Comprehensive PDF saved using fallback method');
      }

      toast.dismiss('comprehensive-export');
      toast.success(
        `Comprehensive analysis report with ${allChartData.length} charts exported successfully!`
      );
    } catch (error) {
      console.error('Comprehensive PDF export error:', error);
      toast.dismiss('comprehensive-export');

      let errorMessage = 'Failed to export comprehensive report. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
      console.log('Comprehensive PDF export process completed');
    }
  };

  const exportAllDataAsCSV = () => {
    try {
      const generateCSV = (data: any[], title: string): string => {
        if (!data || data.length === 0) {
          return `${title}\nNo data available\n`;
        }

        const headers = Object.keys(data[0]);
        const csvRows = [
          `# ${title}`,
          `# Generated on ${new Date().toLocaleString()}`,
          `# Total records: ${data.length}`,
          '',
          headers.join(','),
          ...data.map((row) =>
            headers
              .map((header) => {
                const value = row[header];
                if (value === null || value === undefined) return '';
                return `"${String(value).replace(/"/g, '""')}"`;
              })
              .join(',')
          ),
        ];

        return csvRows.join('\n');
      };

      const allData = {
        summary: [summary],
        municipalityData,
        yearlyData,
        statusData,
      };

      const csvFiles: { name: string; content: string }[] = [];

      // Generate CSV for each data set
      Object.entries(allData).forEach(([key, data]) => {
        if (Array.isArray(data) && data.length > 0) {
          const title = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
          const csvContent = generateCSV(data, title);
          csvFiles.push({
            name: `${key.toLowerCase().replace(/\s+/g, '-')}.csv`,
            content: csvContent,
          });
        }
      });

      // Create multiple downloads
      csvFiles.forEach((file, index) => {
        setTimeout(() => {
          const blob = new Blob([file.content], {
            type: 'text/csv;charset=utf-8;',
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `project-data-${file.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, index * 500);
      });

      toast.success(`Exporting ${csvFiles.length} data files...`);
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export data files');
    }
  };

  // Generate insights for individual charts with proper error handling
  const generateInsights = async (
    chartTitle: string,
    data: any[],
    chartType: string,
    dataType: string
  ) => {
    try {
      const response = await fetch('/api/chart-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chartTitle,
          chartType,
          dataType,
          data,
          summaryStats: summary,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return result.data.insights;
      } else {
        return generateFallbackInsights(chartTitle, data, dataType);
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return generateFallbackInsights(chartTitle, data, dataType);
    }
  };

  // Generate cross-chart insights
  const generateCrossChartInsights = async () => {
    const allData = {
      municipalities: municipalityData,
      yearly: yearlyData,
      status: statusData,
      summary,
    };

    const crossInsights = `
**Cross-Chart Analysis Summary:**

• **Geographic Distribution**: ${municipalityData.length} municipalities involved in development projects
• **Temporal Trends**: Projects span ${yearlyData.length} years with varying intensity
• **Status Overview**: Projects distributed across ${statusData.length} different status categories
• **Financial Scope**: Total investment of ₱${summary.totalCost.toLocaleString()} across all projects

**Key Correlations:**
• Municipality with highest project count: ${municipalityData[0]?.municipalityName || 'N/A'} (${municipalityData[0]?.projectCount || 0} projects)
• Peak development year: ${yearlyData.reduce((max, item) => (item.projectCount > max.projectCount ? item : max), yearlyData[0] || {})?.year || 'N/A'}
• Most common project status: ${statusData.reduce((max, item) => (item.count > max.count ? item : max), statusData[0] || {})?.status || 'N/A'}

**Strategic Insights:**
• Development is concentrated in select municipalities, indicating focused investment strategy
• Year-over-year trends show varying development intensity requiring strategic planning
• Status distribution reveals project pipeline health and completion rates
• Average project size of ${(summary.totalAreaDeveloped / summary.totalProjects).toFixed(2)} hectares suggests consistent development scale
    `;

    return crossInsights;
  };

  // Generate fallback insights when API fails
  const generateFallbackInsights = (
    chartTitle: string,
    data: any[],
    dataType: string
  ) => {
    const dataLength = data.length || 0;
    const hasNumericData = data.some((item) =>
      Object.values(item).some(
        (value) => typeof value === 'number' && !isNaN(value as number)
      )
    );

    let insights = `**${chartTitle} Analysis:**\n\n`;

    if (dataLength === 0) {
      insights += '• No data available for analysis\n';
      insights += '• Consider expanding the date range or filter criteria\n';
      return insights;
    }

    insights += `• Dataset contains ${dataLength} data points\n`;

    if (hasNumericData && dataType.includes('cost')) {
      const totalCost = data.reduce((sum, item) => {
        const cost = item.totalCost || item.cost || 0;
        return sum + (typeof cost === 'number' && !isNaN(cost) ? cost : 0);
      }, 0);
      insights += `• Total cost across all items: ₱${totalCost.toLocaleString()}\n`;
    }

    if (hasNumericData && dataType.includes('project')) {
      const totalProjects = data.reduce((sum, item) => {
        const count = item.projectCount || item.count || 1;
        return sum + (typeof count === 'number' && !isNaN(count) ? count : 0);
      }, 0);
      insights += `• Total projects represented: ${totalProjects}\n`;
    }

    insights += `• Data distribution shows ${dataLength > 10 ? 'high' : dataLength > 5 ? 'moderate' : 'low'} diversity\n`;
    insights += '• Further analysis recommended for deeper insights\n';

    return insights;
  };

  return (
    <div className="space-y-6 mt-8 border-t pt-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Generated Report</h2>
          <Badge variant="secondary">AI Generated</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={exportAllDataAsCSV}
            disabled={isExporting}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export All Data
          </Button>
          <Button
            variant="outline"
            size="sm"
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
                <BarChart3 className="h-4 w-4 mr-2" />
                Comprehensive Report
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={reportRef}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <div
                  data-chart
                  data-chart-title="Projects by Municipality"
                  className="w-full h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
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
                      <Bar
                        dataKey="projectCount"
                        fill="#3b82f6"
                        name="Projects"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
                <div
                  data-chart
                  data-chart-title="Yearly Project Trends"
                  className="w-full h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
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
                </div>
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
                <div
                  data-chart
                  data-chart-title="Project Status Distribution"
                  className="w-full h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
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
                </div>
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
                <div
                  data-chart
                  data-chart-title="Cost by Municipality"
                  className="w-full h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Analysis */}
        {aiAnalysis && (
          <Card className="mt-6">
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
    </div>
  );
};

export default InlineReportViewer;
