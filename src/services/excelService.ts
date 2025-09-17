import * as ExcelJS from 'exceljs';
import { ExcelData, CellChange } from '@/schemas/excel';

export class ExcelService {
  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  // Initialize from Excel buffer
  async initializeFromBuffer(buffer: ArrayBuffer | Uint8Array): Promise<void> {
    this.workbook = new ExcelJS.Workbook();

    try {
      // Convert to Buffer if needed
      let bufferData: Buffer;
      if (buffer instanceof ArrayBuffer) {
        bufferData = Buffer.from(buffer);
      } else if (buffer instanceof Uint8Array) {
        bufferData = Buffer.from(buffer);
      } else {
        bufferData = buffer as Buffer;
      }

      console.log('Loading Excel file, buffer size:', bufferData.length);

      // Check file signature to identify file type
      const fileSignature = Array.from(bufferData.slice(0, 8))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
      console.log('File signature:', fileSignature);

      // Check if it's a ZIP file (which .xlsx files are)
      const isZipFile = bufferData[0] === 0x50 && bufferData[1] === 0x4b;
      console.log('Is ZIP file (likely .xlsx):', isZipFile);

      // Try to load as .xlsx first
      try {
        await this.workbook.xlsx.load(bufferData as any);
        console.log('Successfully loaded as XLSX');

        // If the workbook loaded but has no worksheets, this is the issue
        if (this.workbook.worksheets.length === 0) {
          console.log('Workbook loaded but contains no worksheets');
          throw new Error('Loaded workbook contains no worksheets');
        }

        // Check if worksheets have any actual data
        let hasData = false;
        for (const worksheet of this.workbook.worksheets) {
          console.log(`Checking worksheet: ${worksheet.name}`);
          console.log(`Worksheet info:`, {
            rowCount: worksheet.rowCount,
            columnCount: worksheet.columnCount,
            actualRowCount: worksheet.actualRowCount,
            actualColumnCount: worksheet.actualColumnCount,
          });

          // Try to find any non-empty cell
          let cellCount = 0;
          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
              if (
                cell.value !== null &&
                cell.value !== undefined &&
                cell.value !== ''
              ) {
                cellCount++;
                if (cellCount <= 5) {
                  console.log(`Found cell ${cell.address}: ${cell.value}`);
                }
              }
            });
          });

          if (cellCount > 0) {
            hasData = true;
            console.log(
              `Worksheet ${worksheet.name} has ${cellCount} cells with data`
            );
          }
        }

        if (!hasData) {
          console.log(
            'No data found in any worksheet, trying alternative parsing...'
          );
          throw new Error('No data found in worksheets');
        }
      } catch (xlsxError) {
        console.log('XLSX load failed, trying CSV:', xlsxError);

        // If XLSX fails, try as CSV
        try {
          const csvData = bufferData.toString('utf-8');
          await this.workbook.csv.readFile(csvData);
          console.log('Successfully loaded as CSV');
        } catch (csvError) {
          console.log('CSV load also failed:', csvError);

          // Try reading as .xls (older Excel format)
          console.log('Trying to handle as legacy .xls or text format');

          // Create a worksheet and try to parse as delimited text
          const worksheet = this.workbook.addWorksheet('Sheet1');

          // Convert buffer to text and try to parse
          const textData = bufferData.toString('utf-8');
          console.log('Text data preview:', textData.substring(0, 500));

          // Split into lines and process
          const lines = textData.split(/\r?\n/).filter((line) => line.trim());
          console.log(`Found ${lines.length} non-empty lines`);

          if (lines.length > 0) {
            lines.forEach((line, rowIndex) => {
              // Try different delimiters: comma, tab, semicolon, pipe
              let cells: string[] = [];

              if (line.includes('\t')) {
                cells = line.split('\t');
              } else if (line.includes(',')) {
                cells = line.split(',');
              } else if (line.includes(';')) {
                cells = line.split(';');
              } else if (line.includes('|')) {
                cells = line.split('|');
              } else {
                // Fallback: treat the whole line as one cell
                cells = [line];
              }

              cells.forEach((cellValue, colIndex) => {
                const cleanValue = cellValue.trim().replace(/^["']|["']$/g, ''); // Remove quotes
                if (cleanValue) {
                  const cell = worksheet.getCell(rowIndex + 1, colIndex + 1);
                  // Try to parse as number if it looks like one
                  const numValue = Number(cleanValue);
                  cell.value =
                    !isNaN(numValue) && cleanValue !== ''
                      ? numValue
                      : cleanValue;
                }
              });
            });

            console.log(`Created worksheet with ${lines.length} rows`);
          } else {
            throw new Error(
              'File appears to be empty or in an unsupported format'
            );
          }
        }
      }

      console.log('Workbook loaded:', {
        worksheetCount: this.workbook.worksheets.length,
        worksheetNames: this.workbook.worksheets.map((ws) => ws.name),
      });

      // Log first worksheet details if it exists
      if (this.workbook.worksheets.length > 0) {
        const firstWorksheet = this.workbook.worksheets[0];
        console.log('First worksheet:', {
          name: firstWorksheet.name,
          rowCount: firstWorksheet.rowCount,
          columnCount: firstWorksheet.columnCount,
          actualRowCount: firstWorksheet.actualRowCount,
          actualColumnCount: firstWorksheet.actualColumnCount,
          dimensions: firstWorksheet.dimensions,
        });

        // Also log some sample cell values for debugging
        console.log('Sample cells:');
        for (
          let row = 1;
          row <= Math.min(5, firstWorksheet.actualRowCount || 5);
          row++
        ) {
          for (
            let col = 1;
            col <= Math.min(5, firstWorksheet.actualColumnCount || 5);
            col++
          ) {
            const cell = firstWorksheet.getCell(row, col);
            if (
              cell.value !== null &&
              cell.value !== undefined &&
              cell.value !== ''
            ) {
              console.log(`${cell.address}: ${cell.value}`);
            }
          }
        }
      } else {
        throw new Error('No worksheets found in the uploaded file');
      }
    } catch (error) {
      console.error('Failed to initialize from buffer:', error);
      throw new Error(
        `Failed to load Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Initialize from JSON data
  async initializeFromData(data: ExcelData): Promise<void> {
    this.workbook = new ExcelJS.Workbook();

    console.log('initializeFromData: Input data:', data);
    console.log('Worksheets in data:', Object.keys(data.worksheets));

    Object.entries(data.worksheets).forEach(([sheetName, sheetData]) => {
      console.log(`Creating worksheet: ${sheetName}`);
      console.log(`Sheet data cells:`, Object.keys(sheetData.cells).length);

      const worksheet = this.workbook.addWorksheet(sheetName);

      Object.entries(sheetData.cells).forEach(([address, cellData]) => {
        console.log(`Setting cell ${address} to:`, cellData.value);
        const cell = worksheet.getCell(address);

        if (cellData.formula) {
          cell.value = { formula: cellData.formula };
        } else {
          cell.value = cellData.value;
        }

        if (cellData.style) {
          cell.style = cellData.style;
        }
      });

      console.log(
        `Worksheet ${sheetName} created with ${Object.keys(sheetData.cells).length} cells`
      );
    });

    console.log('Final workbook worksheets:', this.workbook.worksheets.length);
  }

  // Apply a single cell change
  applyCellChange(change: CellChange, worksheetName: string = 'Sheet1'): void {
    const worksheet =
      this.workbook.getWorksheet(worksheetName) ||
      this.workbook.addWorksheet(worksheetName);

    const cell = worksheet.getCell(change.address);
    cell.value = change.value;
  }

  // Get current data as JSON
  exportToData(): ExcelData {
    const data: ExcelData = { worksheets: {} };

    console.log(
      'exportToData: Processing',
      this.workbook.worksheets.length,
      'worksheets'
    );

    this.workbook.eachSheet((worksheet) => {
      console.log(`Processing worksheet: ${worksheet.name}`);
      const sheetData: any = { cells: {} };

      // Try multiple approaches to extract data
      let cellsFound = 0;

      // Method 1: Using eachRow
      try {
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            // Be more lenient about what we consider "empty"
            const cellValue = cell.value;
            if (cellValue !== null && cellValue !== undefined) {
              // Handle different cell value types
              let finalValue = cellValue;

              // If it's a rich text object, extract the text
              if (
                typeof cellValue === 'object' &&
                (cellValue as any).richText
              ) {
                finalValue = (cellValue as any).richText
                  .map((rt: any) => rt.text)
                  .join('');
              }
              // If it's a formula result object
              else if (
                typeof cellValue === 'object' &&
                (cellValue as any).result !== undefined
              ) {
                finalValue = (cellValue as any).result;
              }
              // Convert empty strings to actual empty, but keep zeros and other falsy values
              else if (finalValue === '') {
                return; // Skip truly empty strings
              }

              const address = cell.address;
              sheetData.cells[address] = {
                value: finalValue,
                formula: cell.formula,
                style: cell.style,
              };
              cellsFound++;

              // Log first few cells for debugging
              if (cellsFound <= 10) {
                console.log(
                  `Cell ${address}: "${finalValue}" (type: ${typeof finalValue})`
                );
              }
            }
          });
        });
      } catch (error) {
        console.log('Method 1 (eachRow) failed:', error);
      }

      // Method 2: Using worksheet dimensions if Method 1 didn't work
      if (cellsFound === 0 && worksheet.dimensions) {
        console.log('Trying Method 2: dimensions approach');
        const { top, left, bottom, right } = worksheet.dimensions;
        for (let row = top; row <= bottom; row++) {
          for (let col = left; col <= right; col++) {
            try {
              const cell = worksheet.getCell(row, col);
              if (
                cell.value !== null &&
                cell.value !== undefined &&
                cell.value !== ''
              ) {
                const address = cell.address;
                sheetData.cells[address] = {
                  value: cell.value,
                  formula: cell.formula,
                  style: cell.style,
                };
                cellsFound++;
              }
            } catch (error) {
              // Skip invalid cells
            }
          }
        }
      }

      // Method 3: Brute force approach for the first 100 rows and 26 columns
      if (cellsFound === 0) {
        console.log('Trying Method 3: brute force approach');
        for (let row = 1; row <= 100; row++) {
          for (let col = 1; col <= 26; col++) {
            try {
              const cell = worksheet.getCell(row, col);
              if (
                cell.value !== null &&
                cell.value !== undefined &&
                cell.value !== ''
              ) {
                const address = cell.address;
                sheetData.cells[address] = {
                  value: cell.value,
                  formula: cell.formula,
                  style: cell.style,
                };
                cellsFound++;
              }
            } catch (error) {
              // Skip invalid cells
            }
          }
        }
      }

      console.log(`Found ${cellsFound} cells in worksheet ${worksheet.name}`);
      data.worksheets[worksheet.name] = sheetData;
    });

    console.log('exportToData result:', data);
    return data;
  }

  // Export to Excel buffer
  async exportToBuffer(): Promise<ExcelJS.Buffer> {
    return await this.workbook.xlsx.writeBuffer();
  }

  async exportToJson(): Promise<string> {
    const data = this.exportToData();
    return JSON.stringify(data);
  }

  // Get worksheet data for rendering
  getWorksheetData(worksheetName?: string) {
    // If no worksheet name provided, try to use the first worksheet
    let worksheet;
    if (worksheetName) {
      worksheet = this.workbook.getWorksheet(worksheetName);
    } else if (this.workbook.worksheets.length > 0) {
      worksheet = this.workbook.worksheets[0];
      console.log(`Using first worksheet: ${worksheet.name}`);
    }

    if (!worksheet) {
      console.log(
        `No worksheet found. Available worksheets:`,
        this.workbook.worksheets.map((ws) => ws.name)
      );
      return null;
    }

    console.log(`Getting data from worksheet: ${worksheet.name}`);
    console.log(`Worksheet dimensions:`, worksheet.dimensions);
    console.log(
      `Row count: ${worksheet.rowCount}, Column count: ${worksheet.columnCount}`
    );

    const data: any[][] = [];
    let cellCount = 0;

    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (!data[rowNumber - 1]) {
        data[rowNumber - 1] = [];
      }
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        data[rowNumber - 1][colNumber - 1] = cell.value;
        if (
          cell.value !== null &&
          cell.value !== undefined &&
          cell.value !== ''
        ) {
          cellCount++;
          if (cellCount <= 5) {
            console.log(`Sample cell ${cell.address}: ${cell.value}`);
          }
        }
      });
    });

    console.log(
      `Retrieved ${data.length} rows with ${cellCount} non-empty cells`
    );
    return data;
  }
}
