'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  editProjectSchema,
  EditProjectData,
  ProjectResponse,
} from '@/schemas/project';
import { useComponents, useMunicipalities } from '@/hooks/useProjects';
import { uploadFile } from '@/actions/upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Upload, X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface EditProjectFormProps {
  project: ProjectResponse['data'];
  onSuccess?: () => void;
}

const EditProjectForm = ({ project, onSuccess }: EditProjectFormProps) => {
  const {
    components,
    isLoading: componentsLoading,
    mutate: mutateComponents,
  } = useComponents();
  const { municipalities, isLoading: municipalitiesLoading } =
    useMunicipalities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; url: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [barangaySearch, setBarangaySearch] = useState('');

  const form = useForm<EditProjectData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      title: project.title,
      projectCode: project.projectCode || '',
      startDate: project.startDate,
      endDate: project.endDate || '',
      totalAreaDeveloped: project.totalAreaDeveloped || undefined,
      description: project.description || '',
      totalProjectCost: project.totalProjectCost || undefined,
      barangayId: project.barangay.id,
      components: project.components.map((comp) => ({
        componentTitle: comp.componentTitle,
        componentDescription: comp.componentDescription || '',
        componentCost: comp.componentCost,
      })),
      attachmentUrls: project.attachments.map((att) => att.url),
    },
  });

  // Initialize uploaded files from existing attachments
  useEffect(() => {
    const existingFiles = project.attachments.map((att) => ({
      name: att.url.split('/').pop() || 'attachment',
      url: att.url,
    }));
    setUploadedFiles(existingFiles);
  }, [project.attachments]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'components',
  });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadFile(file);
        return { name: file.name, url: result.publicUrl };
      });

      const uploadedFilesData = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...uploadedFilesData]);
      form.setValue('attachmentUrls', [
        ...(form.getValues('attachmentUrls') || []),
        ...uploadedFilesData.map((f) => f.url),
      ]);
      toast.success(
        `${uploadedFilesData.length} file(s) uploaded successfully`
      );
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    form.setValue(
      'attachmentUrls',
      newFiles.map((f) => f.url)
    );
  };

  const addComponent = () => {
    append({ componentTitle: '', componentDescription: '', componentCost: 0 });
  };

  const onSubmit = async (data: EditProjectData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/project/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Project updated successfully');
        mutateComponents();
        onSuccess?.();
      } else {
        toast.error(result.message || 'Failed to update project');
      }
    } catch (error) {
      toast.error('An error occurred while updating the project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter municipalities and barangays based on search
  const filteredMunicipalities = municipalities
    .filter((municipality) => {
      if (!barangaySearch) return true;
      const searchLower = barangaySearch.toLowerCase();
      return (
        municipality.name.toLowerCase().includes(searchLower) ||
        municipality.barangays.some((barangay) =>
          barangay.name.toLowerCase().includes(searchLower)
        )
      );
    })
    .map((municipality) => ({
      ...municipality,
      barangays: municipality.barangays.filter(
        (barangay) =>
          !barangaySearch ||
          barangay.name.toLowerCase().includes(barangaySearch.toLowerCase()) ||
          municipality.name.toLowerCase().includes(barangaySearch.toLowerCase())
      ),
    }));

  // Show loading state while data is being fetched
  if (componentsLoading || municipalitiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading form data...</span>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="barangayId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Location</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search municipalities or barangays..."
                          value={barangaySearch}
                          onChange={(e) => setBarangaySearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select barangay location" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredMunicipalities.length === 0 ? (
                            <SelectItem value="no-results" disabled>
                              No results found
                            </SelectItem>
                          ) : (
                            filteredMunicipalities.map((municipality) => (
                              <React.Fragment key={municipality.id}>
                                <SelectItem
                                  value={municipality.id}
                                  disabled
                                  className="font-semibold text-gray-900"
                                >
                                  {municipality.name}
                                </SelectItem>
                                {municipality.barangays.map((barangay) => (
                                  <SelectItem
                                    key={barangay.id}
                                    value={barangay.id}
                                    className="pl-6"
                                  >
                                    {barangay.name}
                                  </SelectItem>
                                ))}
                              </React.Fragment>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAreaDeveloped"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Area Developed (hectares)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalProjectCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Project Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter project description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Project Components
              <Button type="button" onClick={addComponent} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Component {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`components.${index}.componentTitle`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Component Title</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            placeholder="Type component title"
                            value={field.value}
                            onChange={field.onChange}
                          />
                          {components.length > 0 && (
                            <Select
                              onValueChange={(value) => {
                                if (value !== 'custom') {
                                  field.onChange(value);
                                }
                              }}
                              value={
                                components.some(
                                  (c) => c.componentTitle === field.value
                                )
                                  ? field.value
                                  : 'custom'
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Or select from existing components" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value="custom"
                                  className="text-gray-500"
                                >
                                  Type custom component title above
                                </SelectItem>
                                {components.map((comp) => (
                                  <SelectItem
                                    key={comp.id}
                                    value={comp.componentTitle}
                                  >
                                    {comp.componentTitle}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`components.${index}.componentDescription`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Component Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter component description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`components.${index}.componentCost`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Component Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button type="button" disabled={uploading} size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files:</h4>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting || componentsLoading || municipalitiesLoading
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Project'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditProjectForm;
