'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSteward } from '@/hooks/useStewards';
import EvaluateStewardForm from '@/components/forms/EvaluateStewardForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DASHBOARD_ROUTES } from '@/lib/routes';

const EvaluateStewardPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stewardId = searchParams.get('stewardId');

  const { steward, isLoading, error } = useSteward(stewardId || '');

  const handleSuccess = () => {
    if (stewardId) {
      router.push(`/app/stewards/${stewardId}`);
    } else {
      router.push(DASHBOARD_ROUTES.stewards);
    }
  };

  if (!stewardId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center text-center">
              <div>
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Invalid Request</h3>
                <p className="text-muted-foreground mb-4">
                  No steward ID provided for evaluation.
                </p>
                <Link href={DASHBOARD_ROUTES.stewards}>
                  <Button>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Stewards
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center text-center">
              <div>
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Steward Not Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  The steward you're trying to evaluate could not be found.
                </p>
                <Link href={DASHBOARD_ROUTES.stewards}>
                  <Button>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Stewards
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !steward) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/app/stewards/${stewardId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Steward
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Evaluate Steward
            </h1>
            <p className="text-muted-foreground">
              Provide performance evaluation and feedback
            </p>
          </div>
        </div>
      </div>

      <EvaluateStewardForm
        stewardId={steward.id}
        stewardName={steward.name}
        cscNumber={steward.cscNumber}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default EvaluateStewardPage;
