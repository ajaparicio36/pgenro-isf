'use client';
import { RegisterData, registerSchema } from '@/schemas/auth';
import { signup } from '@/actions/auth';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Building2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

const RegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterData) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signup(values);

      if (result.success) {
        setShowVerificationMessage(true);
        form.reset();
      } else {
        // TypeScript now knows this is the error type
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show email verification message instead of the form
  if (showVerificationMessage) {
    return (
      <div className="text-center space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Check your email
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              We've sent a verification link to your email address. Please check
              your inbox and click the link to verify your account.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowVerificationMessage(false)}
          className="w-full"
        >
          Back to registration
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="companyName"
            type="text"
            placeholder="Enter your company name"
            className="pl-10"
            {...form.register('companyName')}
          />
        </div>
        {form.formState.errors.companyName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.companyName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-email"
            type="email"
            placeholder="Enter your email"
            className="pl-10"
            {...form.register('email')}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            className="pl-10 pr-10"
            {...form.register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            className="pl-10 pr-10"
            {...form.register('confirmPassword')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
};

export default RegisterForm;
