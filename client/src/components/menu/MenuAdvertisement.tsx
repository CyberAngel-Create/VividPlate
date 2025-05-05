import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Advertisement } from "@shared/schema";
import { ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "wouter";

interface MenuAdvertisementProps {
  position: "top" | "bottom" | "sidebar";
  restaurantId?: string | number;
}

const MenuAdvertisement = ({ position, restaurantId }: MenuAdvertisementProps) => {
  const params = useParams();
  const activeRestaurantId = restaurantId || params.restaurantId;
  
  const [imageUrl, setImageUrl] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  
  const { data: advertisement, isLoading } = useQuery<Advertisement>({
    queryKey: ["/api/advertisements", position, activeRestaurantId],
    queryFn: async ({ queryKey }) => {
      try {
        const [_, pos, restId] = queryKey;
        const url = new URL("/api/advertisements", window.location.origin);
        url.searchParams.append("position", pos as string);
        if (restId) {
          url.searchParams.append("restaurantId", restId as string);
        }
        
        const response = await fetch(url.toString());
        
        // If the response is not OK, return null instead of throwing an error
        if (!response.ok) {
          console.log(`Advertisement not available for ${position} position (status: ${response.status})`);
          return null;
        }
        
        // Check if response is empty
        const text = await response.text();
        if (!text || text.trim() === '') {
          console.log('Empty advertisement response');
          return null;
        }
        
        // Try to parse the JSON
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.log(`Invalid JSON in advertisement response: ${parseError}`);
          console.log(`Response text: ${text.substring(0, 100)}...`);
          return null;
        }
      } catch (error) {
        console.log(`Error fetching advertisement: ${error}`);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: false, // Don't retry on failure
  });

  useEffect(() => {
    if (advertisement) {
      setImageUrl(advertisement.imageUrl || "");
      setLinkUrl(advertisement.linkUrl || "");
    }
  }, [advertisement]);

  // If there's no active advertisement for this position or still loading, return null
  if (isLoading || !advertisement || !advertisement.isActive) {
    return null;
  }
  
  // Check if the ad is within its active period
  const now = new Date();
  if (advertisement.startDate && new Date(advertisement.startDate) > now) {
    return null; // Ad hasn't started yet
  }
  if (advertisement.endDate && new Date(advertisement.endDate) < now) {
    return null; // Ad has expired
  }

  const hasLink = linkUrl && linkUrl.trim() !== "";
  const hasImage = imageUrl && imageUrl.trim() !== "";

  // Different styling based on position
  const getPositionStyles = () => {
    switch (position) {
      case "top":
        return "w-full mb-6";
      case "bottom":
        return "w-full mt-6";
      case "sidebar":
        return "w-full mb-4";
      default:
        return "w-full";
    }
  };

  return (
    <Card className={`${getPositionStyles()} overflow-hidden ad-container`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-center">
          {hasImage && (
            <div className={`${position === "sidebar" ? "w-full" : "w-full sm:w-1/3"} overflow-hidden max-h-[200px]`}>
              <img 
                src={imageUrl} 
                alt={advertisement.title}
                className="w-full h-full object-cover" 
              />
            </div>
          )}
          
          <div className={`p-4 ${hasImage ? (position === "sidebar" ? "w-full" : "w-full sm:w-2/3") : "w-full"}`}>
            <h3 className="text-lg font-semibold">{advertisement.title}</h3>
            
            {advertisement.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 mb-4">
                {advertisement.description}
              </p>
            )}
            
            {hasLink && (
              <div className="mt-3">
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <a 
                    href={linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Learn More
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuAdvertisement;