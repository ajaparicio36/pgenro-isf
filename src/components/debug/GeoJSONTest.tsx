'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GeoJSONTest = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testGeoJSON = async () => {
      try {
        console.log('Testing GeoJSON file access...');

        // Test if file exists
        const response = await fetch('/data/province_barangays.json');
        console.log('Response status:', response.status, response.statusText);
        console.log(
          'Response headers:',
          Object.fromEntries(response.headers.entries())
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        setTestResult({
          success: true,
          fileSize: JSON.stringify(data).length,
          type: data.type,
          featuresCount: data.features?.length || 0,
          sampleFeature: data.features?.[0] || null,
          sampleProperties: data.features?.[0]?.properties || null,
        });
      } catch (error) {
        console.error('GeoJSON test failed:', error);
        setTestResult({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setLoading(false);
      }
    };

    testGeoJSON();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>GeoJSON File Test</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Testing file access...</p>
        ) : (
          <pre className="text-xs overflow-auto max-h-96 bg-gray-50 p-4 rounded">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

export default GeoJSONTest;
