import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await apiRequest('POST', '/api/auth/forgot-password', values);
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage(data.message || 'Password reset instructions have been sent to your email.');
        form.reset();
      } else {
        setErrorMessage(data.message || 'Failed to process request');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again later.');
      console.error('Forgot password error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Forgot Password</h1>
        <p className="text-gray-500">
          Enter your email address below and we'll send you instructions to reset your password.
        </p>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border-green-500 text-green-700">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="bg-red-50 border-red-500 text-red-700">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
          
          <div className="text-center">
            <Button variant="link" onClick={() => window.history.back()}>
              Back to Login
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}