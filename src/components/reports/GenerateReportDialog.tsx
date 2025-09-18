'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReportFilters, reportFiltersSchema } from '@/schemas/report';
import { useReport } from '@/hooks/useReport';
import { useMunicipalities } from '@/hooks/useProjects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Loader2 } from 'lucide-react';
import ReportViewer from './ReportViewer';

interface GenerateReportDialogProps {
  children: React.ReactNode;
}

const GenerateReportDialog = ({ children }: GenerateReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { generateReport, reportData, isLoading } = useReport();
  const { municipalities, isLoading: loadingMunicipalities } =
    useMunicipalities();

  const form = useForm<ReportFilters>({
    resolver: zodResolver(reportFiltersSchema),
    defaultValues: {
      startYear: '2020',
      endYear: new Date().getFullYear().toString(),
      municipalityIds: [],
      barangayIds: [],
    },
  });

  const selectedMunicipalities = form.watch('municipalityIds') || [];
  const availableBarangays = municipalities
    .filter((m) => selectedMunicipalities.includes(m.id))
    .flatMap((m) => m.barangays);

  const onSubmit = async (data: ReportFilters) => {
    try {
      await generateReport(data);
      setShowReport(true);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleBack = () => {
    setShowReport(false);
  };

  const handleClose = () => {
    setOpen(false);
    setShowReport(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {!showReport ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Report
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="2000"
                            max={new Date().getFullYear()}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="2000"
                            max={new Date().getFullYear()}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="municipalityIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>Municipalities (Optional)</FormLabel>
                        <FormControl>
                          <ScrollArea className="h-32 border rounded-md p-3">
                            {loadingMunicipalities ? (
                              <div className="flex justify-center">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {municipalities.map((municipality) => (
                                  <FormField
                                    key={municipality.id}
                                    control={form.control}
                                    name="municipalityIds"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(
                                              municipality.id
                                            )}
                                            onCheckedChange={(checked) => {
                                              const value = field.value || [];
                                              if (checked) {
                                                field.onChange([
                                                  ...value,
                                                  municipality.id,
                                                ]);
                                              } else {
                                                field.onChange(
                                                  value.filter(
                                                    (id) =>
                                                      id !== municipality.id
                                                  )
                                                );
                                                // Also clear barangays from this municipality
                                                const barangayIds =
                                                  form.getValues(
                                                    'barangayIds'
                                                  ) || [];
                                                const municipalityBarangayIds =
                                                  municipality.barangays.map(
                                                    (b) => b.id
                                                  );
                                                form.setValue(
                                                  'barangayIds',
                                                  barangayIds.filter(
                                                    (id) =>
                                                      !municipalityBarangayIds.includes(
                                                        id
                                                      )
                                                  )
                                                );
                                              }
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal">
                                          {municipality.name} (
                                          {municipality.barangays.length}{' '}
                                          barangays)
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {availableBarangays.length > 0 && (
                    <FormField
                      control={form.control}
                      name="barangayIds"
                      render={() => (
                        <FormItem>
                          <FormLabel>Barangays (Optional)</FormLabel>
                          <FormControl>
                            <ScrollArea className="h-32 border rounded-md p-3">
                              <div className="space-y-2">
                                {availableBarangays.map((barangay) => (
                                  <FormField
                                    key={barangay.id}
                                    control={form.control}
                                    name="barangayIds"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(
                                              barangay.id
                                            )}
                                            onCheckedChange={(checked) => {
                                              const value = field.value || [];
                                              if (checked) {
                                                field.onChange([
                                                  ...value,
                                                  barangay.id,
                                                ]);
                                              } else {
                                                field.onChange(
                                                  value.filter(
                                                    (id) => id !== barangay.id
                                                  )
                                                );
                                              }
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal">
                                          {barangay.name}
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            </ScrollArea>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Generate Report
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <ReportViewer
            reportData={reportData!}
            onBack={handleBack}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GenerateReportDialog;
