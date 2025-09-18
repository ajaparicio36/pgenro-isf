'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createEvaluationSchema,
  CreateEvaluationData,
} from '@/schemas/steward';
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
  FormDescription,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, User, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface EvaluateStewardFormProps {
  stewardId: string;
  stewardName: string;
  cscNumber: string;
  onSuccess?: () => void;
}

const ratingOptions = [
  { value: 1, label: '1 - Poor', color: 'bg-red-500' },
  { value: 2, label: '2 - Below Average', color: 'bg-orange-500' },
  { value: 3, label: '3 - Average', color: 'bg-yellow-500' },
  { value: 4, label: '4 - Good', color: 'bg-blue-500' },
  { value: 5, label: '5 - Excellent', color: 'bg-green-500' },
];

const EvaluateStewardForm = ({
  stewardId,
  stewardName,
  cscNumber,
  onSuccess,
}: EvaluateStewardFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateEvaluationData>({
    resolver: zodResolver(createEvaluationSchema),
    defaultValues: {
      rating: 3,
      recommendation: '',
      ratingRemarks: '',
      actionTaken: '',
      generalRemarks: '',
      stewardId: stewardId,
    },
  });

  const watchedRating = form.watch('rating');

  const onSubmit = async (data: CreateEvaluationData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/steward/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Evaluation submitted successfully');
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to submit evaluation');
        if (result.details) {
          console.error('Validation errors:', result.details);
        }
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error('An error occurred while submitting the evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingBadge = (rating: number) => {
    const option = ratingOptions.find((opt) => opt.value === rating);
    return option ? (
      <Badge className={`${option.color} text-white`}>{option.label}</Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      {/* Steward Info Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Evaluating Steward
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Steward Name
              </label>
              <p className="text-lg font-semibold">{stewardName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                CSC Number
              </label>
              <p className="text-lg font-semibold">{cscNumber}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Performance Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Rating *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {ratingOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value.toString()}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${option.color}`}
                                />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Rate the steward's overall performance from 1 (Poor) to 5
                      (Excellent)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedRating && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected Rating:
                  </p>
                  {getRatingBadge(watchedRating)}
                </div>
              )}

              <FormField
                control={form.control}
                name="ratingRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide specific comments about the rating given..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Explain the reasoning behind the rating
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detailed Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommendations</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide recommendations for improvement or continued good practices..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Suggest specific actions or improvements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actionTaken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actions Taken</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe any actions taken during or as a result of this evaluation..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Document interventions or follow-up actions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="generalRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional comments or observations..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Additional context or observations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuccess?.()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Evaluation'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EvaluateStewardForm;
