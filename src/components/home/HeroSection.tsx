'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, BarChart3, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const HeroSection = () => {
  const router = useRouter();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Content */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  <MapPin className="h-3 w-3 mr-1" />
                  Geospatial Intelligence Platform
                </Badge>

                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Visualize Projects,
                  <span className="text-primary block">Drive Impact</span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-2xl">
                  Transform your project data into powerful insights with
                  AI-driven heatmaps, intelligent reporting, and seamless
                  geographic visualization. Built for government agencies and
                  development organizations.
                </p>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-background/60 backdrop-blur">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">Smart Mapping</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-background/60 backdrop-blur">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">AI Analytics</span>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-background/60 backdrop-blur">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">Chat Assistant</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => router.push('/auth')}
                  className="group"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div>
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-sm text-muted-foreground">
                    Projects Mapped
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">25+</div>
                  <div className="text-sm text-muted-foreground">
                    Municipalities
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-sm text-muted-foreground">
                    Accuracy Rate
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Logo */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-75"></div>
                <div className="relative bg-background/80 backdrop-blur p-8 rounded-2xl border shadow-2xl">
                  <Image
                    src="/logo.png"
                    alt="GeoTrazer Logo"
                    width={300}
                    height={300}
                    className="w-full max-w-xs mx-auto"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-accent/10 rounded-full blur-xl animate-pulse delay-1000"></div>
    </section>
  );
};

export default HeroSection;
