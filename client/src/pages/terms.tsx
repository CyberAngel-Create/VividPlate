
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ScrollText, ShieldCheck, Scale, Clock, Ban, FileWarning, Handshake } from 'lucide-react';

const TermsOfService: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <ScrollText className="h-8 w-8 text-orange-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
                <p className="text-gray-600">MenuMate Digital Menu Platform</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Handshake className="h-5 w-5 text-orange-500" />
              Agreement to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using MenuMate's digital menu platform, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access or use our services.
            </p>
          </section>

          {/* Services */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-orange-500" />
              Description of Services
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">MenuMate provides:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Digital menu creation and management tools</li>
                <li>QR code generation for menu access</li>
                <li>Menu customization and theme options</li>
                <li>Customer feedback collection system</li>
                <li>Multi-language menu support</li>
                <li>Analytics and insights for restaurant owners</li>
              </ul>
            </div>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-orange-500" />
              User Responsibilities
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">As a user of MenuMate, you agree to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not misuse or attempt to manipulate our services</li>
                <li>Not infringe on intellectual property rights</li>
                <li>Respect other users and their content</li>
              </ul>
            </div>
          </section>

          {/* Subscription Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Subscription and Payments
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Some features of MenuMate require a paid subscription. By subscribing, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Pay all applicable fees on time</li>
                <li>Maintain valid payment information</li>
                <li>Accept automatic renewal unless cancelled</li>
                <li>Understand our refund and cancellation policies</li>
              </ul>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Ban className="h-5 w-5 text-orange-500" />
              Prohibited Activities
            </h2>
            <p className="text-gray-700 mb-4">Users may not:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Use the service for illegal purposes</li>
              <li>Upload malicious content or software</li>
              <li>Attempt to gain unauthorized access</li>
              <li>Interfere with platform performance</li>
              <li>Scrape or harvest data without permission</li>
              <li>Impersonate others or misrepresent information</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Intellectual Property Rights</h2>
            <p className="text-gray-700 mb-4">
              MenuMate retains all rights to the platform's code, design, and functionality. Users retain 
              rights to their content while granting us license to use it for service provision.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-orange-500" />
              Limitation of Liability
            </h2>
            <p className="text-gray-700 mb-4">
              MenuMate provides the service "as is" without warranties. We are not liable for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Service interruptions or errors</li>
              <li>Data loss or security breaches</li>
              <li>Third-party content or actions</li>
              <li>Indirect or consequential damages</li>
            </ul>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Modifications to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these terms at any time. Users will be notified of significant 
              changes. Continued use of the service constitutes acceptance of modified terms.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> terms@menumate.com</p>
              <p className="text-gray-700"><strong>Address:</strong> MenuMate Legal Department</p>
              <p className="text-gray-700"><strong>Response Time:</strong> We aim to respond within 2 business days</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 p-6 bg-white rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            These terms of service apply to all MenuMate services and platforms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
