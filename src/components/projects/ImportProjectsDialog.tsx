'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileSpreadsheet, Upload, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import MultipleProjectsForm from './MultipleProjectsForm';

const importFormSchema = z.object({
  file: z.instanceof(File).refine((file) => file.size > 0, {
    message: 'Please select a file to import',
  }),
  instructions: z.string().optional(),
});

type ImportFormData = z.infer<typeof importFormSchema>;

interface InterpretedProject {
  title: string;
  projectCode?: string;
  startDate: string;
  endDate?: string;
  totalAreaDeveloped?: number;
  description?: string;
  totalProjectCost?: number;
  locationText?: string;
  components: {
    componentTitle: string;
    componentDescription?: string;
    componentCost: number;
  }[];
  attachmentUrls?: string[];
}

interface ImportProjectsDialogProps {
  onImportSuccess: () => void;
}

const ImportProjectsDialog = ({
  onImportSuccess,
}: ImportProjectsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [interpretedProjects, setInterpretedProjects] = useState<
    InterpretedProject[] | null
  >(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'review'>('upload');

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      instructions: '',
    },
  });

  const onSubmit = async (data: ImportFormData) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.instructions) {
        formData.append('instructions', data.instructions);
      }

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setInterpretedProjects(result.data);
        setCurrentStep('review');
        toast.success(
          `Successfully interpreted ${result.data.length} projects from your file`
        );
      } else {
        toast.error(result.message || 'Failed to interpret projects');
      }
    } catch (error) {
      toast.error('An error occurred while processing the file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('file', file);
      form.clearErrors('file');
    }
  };

  const handleImportSuccess = () => {
    setIsOpen(false);
    setCurrentStep('upload');
    setInterpretedProjects(null);
    form.reset();
    onImportSuccess();
  };

  const handleCancel = () => {
    if (currentStep === 'review') {
      setCurrentStep('upload');
      setInterpretedProjects(null);
    } else {
      setIsOpen(false);
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Import from Excel
        </Button>
      </DialogTrigger>
      <DialogContent
        className={
          currentStep === 'review'
            ? 'sm:max-w-6xl max-h-[90vh] overflow-y-auto'
            : 'sm:max-w-[500px]'
        }
      >
        {currentStep === 'upload' ? (
          <>
            <DialogHeader>
              <DialogTitle>Import Projects from Excel</DialogTitle>
              <DialogDescription>
                Upload an Excel file containing project data. AI will analyze
                and extract relevant information for you to review and assign
                locations.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Excel File</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                          />
                          <Upload className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Supported formats: .xlsx, .xls, .csv
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide any specific instructions for AI to better understand your data format, column mappings, or special requirements..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Help AI understand your data structure or specific
                        requirements
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Process File
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          interpretedProjects && (
            <MultipleProjectsForm
              projects={interpretedProjects}
              onSuccess={handleImportSuccess}
              onCancel={handleCancel}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportProjectsDialog;
