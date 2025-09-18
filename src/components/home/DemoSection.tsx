'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  BarChart3,
  FileText,
  Play,
  ArrowRight,
  Maximize2,
} from 'lucide-react';

const demos = [
  {
    id: 'heatmap',
    title: 'Interactive Heatmaps',
    description:
      'Visualize project density, costs, and development patterns across regions with dynamic heat mapping.',
    image: '/demo1.jpg',
    icon: MapPin,
    features: [
      'Geographic visualization',
      'Real-time data overlay',
      'Custom filtering',
    ],
    highlight: 'Live Data',
  },
  {
    id: 'ai-charts',
    title: 'AI-Generated Analytics',
    description:
      'Ask questions in natural language and get instant charts and visualizations powered by AI.',
    image: '/demo2.jpg',
    icon: BarChart3,
    features: [
      'Natural language queries',
      'Automatic chart generation',
      'Smart insights',
    ],
    highlight: 'AI Powered',
  },
  {
    id: 'project-management',
    title: 'Project Dashboard',
    description:
      'Comprehensive project listing with advanced filtering, search, and management capabilities.',
    image: '/demo3.jpg',
    icon: FileText,
    features: ['Advanced filtering', 'Bulk operations', 'Status tracking'],
    highlight: 'Complete Control',
  },
];

const DemoSection = () => {
  const [selectedDemo, setSelectedDemo] = useState('heatmap');
  const [imageLoaded, setImageLoaded] = useState<{ [key: string]: boolean }>(
    {}
  );

  const handleImageLoad = (demoId: string) => {
    setImageLoaded((prev) => ({ ...prev, [demoId]: true }));
  };

  const currentDemo =
    demos.find((demo) => demo.id === selectedDemo) || demos[0];

  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="w-fit mx-auto">
              <Play className="h-3 w-3 mr-1" />
              Live Demo
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold">
              See GeoTraizer in
              <span className="text-primary block">Action</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the power of intelligent project visualization and
              management through our interactive platform demonstrations.
            </p>
          </div>

          {/* Demo Showcase */}
          <Tabs
            value={selectedDemo}
            onValueChange={setSelectedDemo}
            className="space-y-8"
          >
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-2xl mx-auto h-auto p-2">
              {demos.map((demo) => (
                <TabsTrigger
                  key={demo.id}
                  value={demo.id}
                  className="flex items-center gap-2 p-4 text-left data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <demo.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">{demo.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {demos.map((demo) => (
              <TabsContent key={demo.id} value={demo.id} className="space-y-8">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  {/* Demo Info */}
                  <div className="space-y-6 lg:order-1">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <demo.icon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="secondary">{demo.highlight}</Badge>
                      </div>

                      <h3 className="text-2xl md:text-3xl font-bold">
                        {demo.title}
                      </h3>

                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {demo.description}
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3">
                      {demo.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-muted-foreground">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button className="group">
                        Try This Feature
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button variant="outline">
                        <Maximize2 className="mr-2 h-4 w-4" />
                        Full Screen Demo
                      </Button>
                    </div>
                  </div>

                  {/* Demo Image */}
                  <div className="lg:order-2">
                    <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background to-muted/30">
                      <CardContent className="p-0 relative">
                        <div className="relative aspect-video bg-muted animate-pulse">
                          <Image
                            src={demo.image}
                            alt={`${demo.title} Demo`}
                            fill
                            className={`object-cover transition-opacity duration-300 ${
                              imageLoaded[demo.id] ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoad={() => handleImageLoad(demo.id)}
                            priority={demo.id === 'heatmap'}
                          />

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent"></div>

                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-background/20 backdrop-blur-sm">
                            <Button
                              size="lg"
                              className="rounded-full w-16 h-16 p-0"
                            >
                              <Play className="h-6 w-6 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Demo Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">
                Projects Visualized
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">25+</div>
              <div className="text-sm text-muted-foreground">
                Municipalities
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground">AI Queries</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
