'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  MapPin,
  BarChart3,
  Bot,
  FileText,
  Upload,
  Zap,
  Shield,
  Users,
  TrendingUp,
} from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Interactive Heatmaps',
    description:
      'Visualize project intensity, costs, and development patterns across geographic regions with dynamic color-coded maps.',
    highlight: 'Smart Visualization',
  },
  {
    icon: Bot,
    title: 'AI-Powered Assistant',
    description:
      'Chat with your data using natural language. Generate reports, create charts, and get insights instantly.',
    highlight: 'Intelligent Queries',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description:
      'Comprehensive reporting with customizable charts, trend analysis, and performance metrics.',
    highlight: 'Data-Driven Insights',
  },
  {
    icon: Upload,
    title: 'Smart Import',
    description:
      'Upload Excel files and let AI automatically extract and organize project data with intelligent matching.',
    highlight: 'Automated Processing',
  },
  {
    icon: FileText,
    title: 'Dynamic Reports',
    description:
      'Generate professional reports with charts, statistics, and AI-powered analysis in seconds.',
    highlight: 'Professional Output',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description:
      'Enterprise-grade security with role-based access control and audit trails for government compliance.',
    highlight: 'Government Ready',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Faster Decision Making',
    stat: '75%',
    description: 'Reduce time spent on data analysis',
  },
  {
    icon: Users,
    title: 'Better Collaboration',
    stat: '90%',
    description: 'Improved team coordination',
  },
  {
    icon: TrendingUp,
    title: 'Increased Efficiency',
    stat: '60%',
    description: 'Boost in project planning speed',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">
              Powerful Features for
              <span className="text-primary block">
                Modern Project Management
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to visualize, analyze, and manage your
              development projects with cutting-edge technology and intuitive
              design.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-0 bg-background/60 backdrop-blur"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {feature.highlight}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="border-t pt-16">
            <div className="text-center space-y-4 mb-12">
              <h3 className="text-2xl md:text-3xl font-bold">
                Measurable Impact
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Organizations using GeoTrazer report significant improvements in
                efficiency and decision-making speed.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center space-y-4">
                  <div className="inline-flex p-4 bg-primary/10 rounded-full">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">
                      {benefit.stat}
                    </div>
                    <h4 className="text-xl font-semibold">{benefit.title}</h4>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
