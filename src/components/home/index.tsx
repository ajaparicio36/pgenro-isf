'use client';

import React from 'react';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import DemoSection from './DemoSection';
import CTASection from './CTASection';

const HomePage = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <DemoSection />
      <CTASection />
    </main>
  );
};

export default HomePage;
