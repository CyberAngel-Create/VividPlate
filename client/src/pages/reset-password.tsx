import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';

export default function ResetPasswordPage() {
  const [location] = useLocation();
  
  // Extract token from URL query parameter
  const params = new URLSearchParams(location.split('?')[1]);
  const token = params.get('token');
  
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-red-600">Invalid Reset Link</h1>
            <p className="text-gray-500">
              The password reset link is invalid or has expired. Please try requesting a new reset link.
            </p>
            <div className="mt-6">
              <a 
                href="/forgot-password" 
                className="inline-block px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
              >
                Request New Link
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Reset Password | MenuMate</title>
      </Helmet>
      
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <ResetPasswordForm token={token} />
        </div>
        
        {/* Right side - Hero Section */}
        <div className="w-full lg:w-1/2 bg-gradient-to-r from-orange-500 to-orange-600 p-8 flex flex-col justify-center text-white">
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-4xl font-bold">Welcome to MenuMate</h2>
            <p className="text-xl">
              The modern solution for digital restaurant menus. Create dynamic, shareable menus with advanced engagement features.
            </p>
            <div className="flex flex-col space-y-4">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Mobile-responsive design for perfect viewing on any device</p>
              </div>
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Generate custom QR codes for contactless ordering</p>
              </div>
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Collect customer feedback and improve your offerings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}