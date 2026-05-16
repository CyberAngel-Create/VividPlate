import { Restaurant } from "@shared/schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { useLocation } from "wouter";
import { getInitials } from "@/lib/utils";

interface RestaurantInfoCardProps {
  restaurant: Restaurant;
}

const RestaurantInfoCard = ({ restaurant }: RestaurantInfoCardProps) => {
  const [, setLocation] = useLocation();

  const handleEdit = () => {
    setLocation(`/edit-restaurant/${restaurant.id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/30 p-6 mb-8 dark:border dark:border-gray-700">
      <div className="flex flex-col md:flex-row items-start md:items-center">
        <Avatar className="w-32 h-32 rounded-lg border dark:border-gray-700 bg-neutral dark:bg-gray-700 mb-4 md:mb-0 md:mr-6">
          {restaurant.logoUrl ? (
            <AvatarImage 
              src={restaurant.logoUrl} 
              alt={`${restaurant.name} logo`} 
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="text-2xl dark:text-gray-300">
              {getInitials(restaurant.name)}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex-grow">
          <h2 className="text-xl font-heading font-bold text-dark dark:text-white mb-2">
            {restaurant.name}
          </h2>
          <p className="text-midgray dark:text-gray-300 mb-3">{restaurant.description || "No description provided."}</p>
          <div className="flex flex-wrap gap-2">
            {restaurant.tags && restaurant.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-neutral dark:bg-gray-700 text-midgray dark:text-gray-300 font-normal"
              >
                {tag}
              </Badge>
            ))}
            {(!restaurant.tags || restaurant.tags.length === 0) && (
              <Badge variant="secondary" className="bg-neutral dark:bg-gray-700 text-midgray dark:text-gray-300 font-normal">
                {restaurant.cuisine || "Restaurant"}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            variant="ghost" 
            className="text-secondary dark:text-secondary-light hover:text-secondary/80 dark:hover:text-secondary-light/80 hover:bg-secondary/10 dark:hover:bg-secondary-dark/20 flex items-center"
            onClick={handleEdit}
          >
            <Edit className="mr-1 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantInfoCard;
