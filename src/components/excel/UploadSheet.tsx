'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { ExcelService } from '@/services/excelService';

interface UploadSheetProps {
  companyId: string;
}

const UploadSheet: React.FC<UploadSheetProps> = ({ companyId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      setError(null);

      // Auto-generate title from filename if not already set
      if (!title) {
        const fileName = selectedFile.name.replace(/\.(xlsx|xls)$/i, '');
        setTitle(fileName);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file || !title.trim()) {
      setError('Please select a file and enter a title');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convert Excel file to JSON using ExcelService
      const excelService = new ExcelService();
      const arrayBuffer = await file.arrayBuffer();

      console.log('File loaded, size:', arrayBuffer.byteLength);

      // Load the Excel file into the service
      await excelService.initializeFromBuffer(new Uint8Array(arrayBuffer));

      // Export to JSON format
      const content = excelService.exportToData();
      console.log('Exported content:', content);
      console.log('Worksheets count:', Object.keys(content.worksheets).length);

      // Log each worksheet's cell count
      Object.entries(content.worksheets).forEach(([name, worksheet]) => {
        console.log(
          `Worksheet "${name}" has ${Object.keys(worksheet.cells).length} cells`
        );
      });

      // Send to API
      const response = await fetch(`/api/excel/${companyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload sheet');
      }

      // Redirect to refresh the page and show the sheet
      router.refresh();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Upload Excel Sheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Sheet Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter sheet title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Excel File</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Excel files (.xlsx, .xls)
                    </p>
                    {file && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        Selected: {file.name}
                      </p>
                    )}
                  </div>
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!file || !title.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Sheet
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadSheet;
