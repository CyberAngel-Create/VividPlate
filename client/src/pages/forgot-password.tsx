import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Helmet } from 'react-helmet-async';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Forgot Password | DigitaMenuMate</title>
      </Helmet>
      
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <ForgotPasswordForm />
        </div>
        
        {/* Right side - Hero Section */}
        <div className="w-full lg:w-1/2 bg-gradient-to-r from-orange-500 to-orange-600 p-8 flex flex-col justify-center text-white">
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-4xl font-bold">Welcome to DigitaMenuMate</h2>
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