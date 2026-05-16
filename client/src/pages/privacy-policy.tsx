import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Cookie, Database, UserCheck, Lock } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
              <Shield className="h-8 w-8 text-orange-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="text-gray-600">VividPlate Digital Menu Platform</p>
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
              <Eye className="h-5 w-5 text-orange-500" />
              Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to VividPlate, a digital menu platform that enables restaurants to create interactive, 
              mobile-responsive menus. We are committed to protecting your privacy and ensuring transparency 
              about how we collect, use, and protect your information when you use our digital menu services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-500" />
              Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">For Restaurant Owners:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Account information (username, email, password)</li>
                  <li>Restaurant details (name, cuisine, contact information, address)</li>
                  <li>Menu content (categories, items, descriptions, prices, images)</li>
                  <li>Subscription and billing information</li>
                  <li>Usage analytics and performance data</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">For Menu Viewers (Customers):</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Feedback information (name, email, rating, comments) - when voluntarily provided</li>
                  <li>Language preferences</li>
                  <li>Basic usage analytics (menu views, QR code scans)</li>
                  <li>Device and browser information for optimal menu display</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-orange-500" />
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide and maintain our digital menu platform services</li>
              <li>Enable restaurant owners to create and manage their menus</li>
              <li>Display menus to customers in their preferred language</li>
              <li>Process customer feedback and deliver it to restaurant owners</li>
              <li>Generate analytics and insights for restaurant performance</li>
              <li>Process payments and manage subscriptions</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Improve our services and develop new features</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Cookie className="h-5 w-5 text-orange-500" />
              Cookies and Tracking
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                <li><strong>Preference Cookies:</strong> Remember your language and display preferences</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how our platform is used</li>
                <li><strong>Authentication Cookies:</strong> Keep restaurant owners logged in securely</li>
              </ul>
              <p className="text-gray-700">
                You can control cookie preferences through your browser settings. However, disabling 
                certain cookies may affect platform functionality.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-500" />
              Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or destruction. 
              This includes encryption of sensitive data, secure authentication systems, and regular 
              security audits. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share 
              information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Customer feedback is shared with the relevant restaurant owners</li>
              <li>With service providers who assist in platform operations (under strict confidentiality)</li>
              <li>When required by law or to protect our legal rights</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Delete your account and associated data</li>
              <li>Withdraw consent for data processing</li>
              <li>Data portability (receive your data in a structured format)</li>
              <li>File a complaint with relevant data protection authorities</li>
            </ul>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> privacy@vividplate.com</p>
              <p className="text-gray-700"><strong>Address:</strong> VividPlate Privacy Office</p>
              <p className="text-gray-700"><strong>Response Time:</strong> We will respond to privacy inquiries within 30 days</p>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Policy Updates</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify users of any material 
              changes by posting the new Privacy Policy on this page and updating the "Last updated" date. 
              Your continued use of our services after such modifications constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 p-6 bg-white rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            This privacy policy applies to all VividPlate digital menu services and platforms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;