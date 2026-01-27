import React from 'react';
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Check, CreditCard, Eye, ExternalLink, FileText, Image, MenuSquare, QrCode, Share2, Store } from "lucide-react";
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
};

const TutorialPage: React.FC = () => {
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'step1',
      title: 'Getting Started',
      description: 'Creating your first restaurant profile',
      icon: <Store className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>The first step to using VividPlate is setting up your restaurant profile:</p>
          <ol className="list-decimal list-inside space-y-2 pl-4">
            <li>Navigate to the <strong>Restaurant Profile</strong> page from the sidebar</li>
            <li>Fill in your restaurant details including name, cuisine type, and contact information</li>
            <li>Upload a logo and banner images to make your menu visually appealing</li>
            <li>Click Save to create your restaurant profile</li>
          </ol>
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Free accounts can create 1 restaurant, while premium accounts can manage up to 3 restaurants.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href="/edit-restaurant">
                <span className="flex items-center gap-2">
                  Go to Restaurant Profile <ExternalLink className="h-4 w-4" />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'step2',
      title: 'Creating Your Menu',
      description: 'Adding categories and menu items',
      icon: <MenuSquare className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Once your restaurant profile is set up, you can create your digital menu:</p>
          <ol className="list-decimal list-inside space-y-2 pl-4">
            <li>Go to the <strong>Create Menu</strong> page</li>
            <li>First, create menu categories (e.g., Appetizers, Main Courses, Desserts)</li>
            <li>Within each category, add menu items with names, descriptions, and prices</li>
            <li>Upload images for your menu items to make them more appealing</li>
            <li>Add dietary tags (vegetarian, gluten-free, etc.) to help customers with dietary preferences</li>
          </ol>
          <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Organize your menu categories in a logical order. You can drag and drop categories to reorder them.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href="/create-menu">
                <span className="flex items-center gap-2">
                  Go to Create Menu <ExternalLink className="h-4 w-4" />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'step3',
      title: 'Customizing Your Menu Design',
      description: 'Personalizing the look and feel',
      icon: <Image className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Make your menu stand out with custom design options:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>Upload multiple banner images to create a slideshow effect</li>
            <li>Customize colors for text, background, and accents</li>
            <li>Choose fonts that match your restaurant's style</li>
            <li>Set currency display preferences</li>
          </ul>
          <p>Preview your changes in real-time to see how customers will view your menu.</p>
          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href="/edit-restaurant">
                <span className="flex items-center gap-2">
                  Customize Design <ExternalLink className="h-4 w-4" />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'step4',
      title: 'Previewing Your Menu',
      description: 'See your menu as customers will',
      icon: <Eye className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Before sharing your menu with customers, preview it to ensure everything looks perfect:</p>
          <ol className="list-decimal list-inside space-y-2 pl-4">
            <li>Go to the <strong>Menu Preview</strong> page</li>
            <li>See your menu exactly as customers will view it</li>
            <li>Test the mobile responsiveness to ensure it works well on all devices</li>
            <li>Check that all images load correctly and text is readable</li>
          </ol>
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Always preview your menu after making changes to ensure everything displays correctly.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href="/menu-preview">
                <span className="flex items-center gap-2">
                  Preview Menu <ExternalLink className="h-4 w-4" />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'step5',
      title: 'Sharing Your Menu',
      description: 'Making your menu accessible to customers',
      icon: <Share2 className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Once your menu is ready, share it with your customers:</p>
          <ol className="list-decimal list-inside space-y-2 pl-4">
            <li>Go to the <strong>Share Menu</strong> page</li>
            <li>Get a unique URL that you can share on social media or your website</li>
            <li>Generate QR codes that customers can scan to view your menu</li>
            <li>Download QR codes to print for your restaurant tables</li>
            <li>Track menu views and QR code scans through your dashboard</li>
          </ol>
          <div className="rounded-md bg-purple-50 dark:bg-purple-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <QrCode className="h-5 w-5 text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  QR codes make it easy for in-person customers to access your digital menu without downloading anything.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href="/share-menu">
                <span className="flex items-center gap-2">
                  Share Your Menu <ExternalLink className="h-4 w-4" />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'step6',
      title: 'Premium Features',
      description: 'Unlock additional capabilities',
      icon: <CreditCard className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Upgrade to premium to access these advanced features:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li><strong>Ad-free experience:</strong> Remove ads from your customer menu view</li>
            <li><strong>Multiple restaurants:</strong> Manage up to 3 different restaurant profiles</li>
            <li><strong>Advanced analytics:</strong> Get detailed insights about your menu performance</li>
            <li><strong>Priority support:</strong> Get faster responses to your questions and issues</li>
          </ul>
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Premium features help enhance your customers' experience and make managing multiple locations easier.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button asChild variant="default" size="sm">
              <Link href="/request-restaurant">
                <span className="flex items-center gap-2">
                  Contact Agent <ExternalLink className="h-4 w-4" />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <RestaurantOwnerLayout>
      <div className="container py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">VividPlate Tutorial</CardTitle>
            <CardDescription>
              Learn how to create and manage your digital restaurant menu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Welcome to VividPlate! This tutorial will guide you through the process of setting up your
                digital menu. Follow these steps to create a beautiful, interactive menu that your customers
                will love.
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                {tutorialSteps.map((step) => (
                  <AccordionItem key={step.id} value={step.id}>
                    <AccordionTrigger className="group">
                      <div className="flex items-center gap-3 text-left">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {step.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{step.title}</h3>
                          <p className="text-muted-foreground text-sm group-hover:text-primary transition-colors">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 px-4">
                      {step.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              <div className="rounded-md bg-muted p-4 mt-6">
                <h3 className="font-medium mb-2">Need more help?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  If you need additional assistance, contact our support team or check our detailed documentation.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/contact">
                      <span className="flex items-center gap-2">
                        Contact Support <ExternalLink className="h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard">
                      <span className="flex items-center gap-2">
                        Return to Dashboard <ExternalLink className="h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RestaurantOwnerLayout>
  );
};

export default TutorialPage;