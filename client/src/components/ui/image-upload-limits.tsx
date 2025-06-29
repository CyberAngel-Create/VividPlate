import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ImageIcon, Upload, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImageUploadLimitsProps {
  className?: string;
}

interface ImageUsageData {
  uploadedImages: number;
  maxImages: number;
  remainingImages: number;
  subscriptionTier: string;
}

const ImageUploadLimits = ({ className = "" }: ImageUploadLimitsProps) => {
  const { user } = useAuth();

  const { data: imageUsage, isLoading } = useQuery({
    queryKey: ['/api/user/image-usage'],
    enabled: !!user,
  });

  if (!user || isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Image Upload Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultUsage: ImageUsageData = {
    uploadedImages: 0,
    maxImages: user.subscriptionTier === 'free' ? 10 : 100,
    remainingImages: user.subscriptionTier === 'free' ? 10 : 100,
    subscriptionTier: user.subscriptionTier || 'free'
  };

  const usage: ImageUsageData = imageUsage && typeof imageUsage === 'object' && imageUsage !== null ? 
    imageUsage as ImageUsageData : defaultUsage;

  const percentageUsed = (usage.uploadedImages / usage.maxImages) * 100;
  const isNearLimit = percentageUsed > 80;
  const isAtLimit = usage.remainingImages <= 0;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Image Upload Limits
          <Badge variant={usage.subscriptionTier === 'free' ? 'secondary' : 'default'} className="text-xs">
            {usage.subscriptionTier.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Images Used</span>
            <span className="font-medium">
              {usage.uploadedImages} / {usage.maxImages}
            </span>
          </div>
          <Progress 
            value={percentageUsed} 
            className={`h-2 ${isAtLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Remaining</span>
          <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'}`}>
            {usage.remainingImages} images
          </span>
        </div>

        {isAtLimit && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">
              Upload limit reached. Upgrade to add more images.
            </span>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">
              Approaching upload limit. Consider upgrading.
            </span>
          </div>
        )}

        {usage.subscriptionTier === 'free' && (
          <div className="text-xs text-gray-500 border-t pt-2">
            Free users: {usage.maxImages} images max. 
            <br />
            Premium users: Unlimited images.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUploadLimits;