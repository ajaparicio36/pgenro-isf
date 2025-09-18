'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Main CTA */}
          <Card className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-2xl">
            <CardContent className="p-12 text-center space-y-8">
              <div className="space-y-4">
                <Badge
                  variant="secondary"
                  className="bg-primary-foreground/20 text-primary-foreground border-0"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Government Ready
                </Badge>

                <h2 className="text-3xl md:text-5xl font-bold">
                  Ready to Transform Your
                  <span className="block">Project Management?</span>
                </h2>

                <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                  Join leading government agencies and development organizations
                  already using GeoTrazer to make data-driven decisions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Calendar className="mr-2 text-black h-4 w-4" />
                  <p className="text-black">Schedule Demo</p>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-primary-foreground/20">
                <div className="text-center">
                  <div className="text-2xl font-bold">30-Day</div>
                  <div className="text-sm text-primary-foreground/80">
                    Free Trial
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-primary-foreground/80">
                    Support
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-sm text-primary-foreground/80">
                    Uptime SLA
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Newsletter Signup */}
            <Card className="bg-background/60 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Stay Updated</h3>
                  <p className="text-muted-foreground">
                    Get the latest features and updates delivered to your inbox.
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                    />
                  </div>
                  <Button>Subscribe</Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  No spam. Unsubscribe at any time.
                </p>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-background/60 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Get in Touch</h3>
                  <p className="text-muted-foreground">
                    Have questions? Our team is here to help you get started.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Email Support</div>
                      <div className="text-sm text-muted-foreground">
                        support@geotrazer.com
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Sales Team</div>
                      <div className="text-sm text-muted-foreground">
                        +63 (2) 123-4567
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Schedule a Call</div>
                      <div className="text-sm text-muted-foreground">
                        Book a personalized demo
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-accent/5 rounded-full blur-xl"></div>
    </section>
  );
};

export default CTASection;
