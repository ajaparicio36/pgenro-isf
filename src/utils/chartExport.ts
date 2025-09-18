export interface ChartExportData {
  title: string;
  element: HTMLElement;
  data: any[];
  insights?: string;
}

export class ChartExportManager {
  static async captureChartAsImage(element: HTMLElement): Promise<string> {
    try {
      // Use SVG approach exclusively for better reliability
      const svgString = await this.captureChartAsSVG(element);
      const rect = element.getBoundingClientRect();
      return await this.convertSVGToImage(svgString, rect.width, rect.height);
    } catch (svgError) {
      console.error('SVG capture failed:', svgError);
      throw new Error(
        `Chart export failed: ${svgError instanceof Error ? svgError.message : 'SVG conversion error'}`
      );
    }
  }

  private static async captureChartAsSVG(
    element: HTMLElement
  ): Promise<string> {
    const svgElement = element.querySelector('svg');
    if (!svgElement) {
      throw new Error(
        'No SVG element found in chart - this chart type may not support image export'
      );
    }

    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true) as SVGElement;

    // Set explicit dimensions
    const rect = svgElement.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 300;

    svgClone.setAttribute('width', width.toString());
    svgClone.setAttribute('height', height.toString());
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.style.backgroundColor = 'white';
    svgClone.style.fontFamily = 'Arial, sans-serif';

    // Fix any problematic colors - handle multiple formats
    const problematicColorSelectors = [
      '[fill*="lab("]',
      '[fill*="hsl("]',
      '[fill*="oklch("]',
      '[fill*="color("]',
      '[stroke*="lab("]',
      '[stroke*="hsl("]',
      '[stroke*="oklch("]',
      '[stroke*="color("]',
    ];

    const standardColors = [
      '#0088FE',
      '#00C49F',
      '#FFBB28',
      '#FF8042',
      '#8884D8',
      '#82ca9d',
    ];

    problematicColorSelectors.forEach((selector) => {
      const elements = svgClone.querySelectorAll(selector);
      elements.forEach((el, index) => {
        const element = el as HTMLElement;
        const attribute = selector.includes('fill') ? 'fill' : 'stroke';
        element.setAttribute(
          attribute,
          standardColors[index % standardColors.length]
        );
      });
    });

    // Ensure text elements have proper colors
    const textElements = svgClone.querySelectorAll('text');
    textElements.forEach((textEl) => {
      const currentFill = textEl.getAttribute('fill');
      if (
        !currentFill ||
        currentFill.includes('lab(') ||
        currentFill.includes('hsl(')
      ) {
        textEl.setAttribute('fill', '#000000');
      }
    });

    // Ensure paths have colors if they don't already
    const pathElements = svgClone.querySelectorAll('path');
    pathElements.forEach((pathEl, index) => {
      const currentFill = pathEl.getAttribute('fill');
      const currentStroke = pathEl.getAttribute('stroke');

      if (!currentFill && !currentStroke) {
        pathEl.setAttribute(
          'fill',
          standardColors[index % standardColors.length]
        );
      }
    });

    return new XMLSerializer().serializeToString(svgClone);
  }

  static async convertSVGToImage(
    svgString: string,
    width: number,
    height: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create SVG blob
      const svgBlob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set high resolution
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);

      // Create image
      const img = new Image();
      img.onload = () => {
        try {
          // Fill white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);

          // Draw SVG
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png', 0.95);
          URL.revokeObjectURL(svgUrl);
          resolve(dataUrl);
        } catch (error) {
          URL.revokeObjectURL(svgUrl);
          reject(new Error(`Canvas drawing failed: ${error}`));
        }
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error(`Failed to load SVG image: ${error}`));
      };

      // Add timeout for image loading
      setTimeout(() => {
        URL.revokeObjectURL(svgUrl);
        reject(
          new Error(
            'SVG image loading timeout - chart may contain unsupported elements'
          )
        );
      }, 10000);

      img.src = svgUrl;
    });
  }

  static generateCSV(data: any[], title: string): string {
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
  }

  static async generateChartInsights(
    chartTitle: string,
    chartType: 'bar' | 'line' | 'pie' | 'area',
    dataType: string,
    data: any[],
    summaryStats: any
  ): Promise<string> {
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
          summaryStats,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return result.data.insights;
      } else {
        return `Insights generation failed: ${result.message}`;
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return 'Insights temporarily unavailable due to technical issues.';
    }
  }
}
