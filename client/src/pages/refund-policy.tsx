import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, Mail, AlertCircle } from 'lucide-react';

const RefundPolicy: React.FC = () => {
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
              <RefreshCw className="h-8 w-8 text-orange-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Refund Policy</h1>
                <p className="text-gray-600">VividPlate Digital Menu Platform</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">

          {/* Overview */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-500" />
              Our Commitment
            </h2>
            <p className="text-gray-700 leading-relaxed">
              At VividPlate, we stand behind the quality of our digital menu platform. We want you to be
              completely satisfied with your subscription. If you are not satisfied for any reason, please
              review our refund policy below and contact our support team.
            </p>
          </section>

          {/* 7-Day Refund */}
          <section className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              7-Day Money-Back Guarantee
            </h2>
            <p className="text-gray-700 mb-4">
              New subscribers are eligible for a <strong>full refund within 7 days</strong> of their first
              payment, provided:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>The refund request is submitted within 7 calendar days of the initial charge</li>
              <li>This is your first subscription purchase (not a renewal)</li>
              <li>You contact us at <a href="mailto:support@vividplate.com" className="text-orange-500 underline">support@vividplate.com</a> with your request</li>
              <li>You have not violated our Terms of Service</li>
            </ul>
            <div className="mt-4 bg-green-100 rounded-lg p-3">
              <p className="text-green-800 text-sm font-medium">
                ✅ Refunds are processed within 5–10 business days to your original payment method.
              </p>
            </div>
          </section>

          {/* Renewal Refunds */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-orange-500" />
              Subscription Renewals
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                For <strong>monthly subscriptions</strong>, renewal charges are generally non-refundable.
                However, if you forgot to cancel before the renewal date, contact us within <strong>48 hours</strong> of
                the renewal charge and we will review your request on a case-by-case basis.
              </p>
              <p>
                For <strong>yearly subscriptions</strong>, if you cancel within 30 days of renewal and have
                not used the service during that period, we will process a pro-rated refund for the unused months.
              </p>
            </div>
          </section>

          {/* Non-Refundable */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Non-Refundable Situations
            </h2>
            <p className="text-gray-700 mb-4">Refunds will <strong>not</strong> be issued in the following cases:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Refund requests submitted after the 7-day window for new subscriptions</li>
              <li>Accounts that have been suspended or terminated due to Terms of Service violations</li>
              <li>Partial use of a subscription period (except pro-rated yearly as described above)</li>
              <li>Dissatisfaction due to features that were clearly described before purchase</li>
              <li>Requests made after the subscription has already been cancelled and access has expired</li>
            </ul>
          </section>

          {/* Cancellation */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              How to Cancel Your Subscription
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>You can cancel your subscription at any time. Cancellation stops future billing but does not
                result in a refund for the current billing period (unless within the 7-day guarantee window).</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-gray-900">To cancel:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Log in to your VividPlate account</li>
                  <li>Go to <strong>Dashboard → Subscription</strong></li>
                  <li>Click <strong>"Manage Subscription"</strong> or contact your payment provider</li>
                  <li>Confirm cancellation — you'll keep access until the end of your billing period</li>
                </ol>
              </div>
            </div>
          </section>

          {/* How to Request a Refund */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              How to Request a Refund
            </h2>
            <p className="text-gray-700 mb-4">
              To request a refund, please contact our support team with the following information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Your registered email address</li>
              <li>Date of the charge</li>
              <li>Reason for the refund request</li>
              <li>Your order or transaction ID (found in your receipt email)</li>
            </ul>
            <div className="mt-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
              <p className="text-gray-700"><strong>📧 Email:</strong>{' '}
                <a href="mailto:support@vividplate.com" className="text-orange-500 underline">support@vividplate.com</a>
              </p>
              <p className="text-gray-700 mt-1"><strong>⏰ Response Time:</strong> We aim to respond within 2 business days</p>
              <p className="text-gray-700 mt-1"><strong>💳 Processing Time:</strong> 5–10 business days after approval</p>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
            <p className="text-gray-700">
              VividPlate reserves the right to modify this Refund Policy at any time. Changes will be
              communicated to existing subscribers via email. Continued use of the service after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="text-center mt-8 p-6 bg-white rounded-lg shadow-sm">
          <p className="text-sm text-gray-500 mb-3">
            This refund policy is part of VividPlate's legal framework.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="/terms" className="text-orange-500 hover:underline">Terms of Service</a>
            <a href="/privacy-policy" className="text-orange-500 hover:underline">Privacy Policy</a>
            <a href="/pricing" className="text-orange-500 hover:underline">Pricing</a>
            <a href="/contact" className="text-orange-500 hover:underline">Contact Us</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
