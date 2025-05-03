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
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center">
        <Avatar className="w-32 h-32 rounded-lg border bg-neutral mb-4 md:mb-0 md:mr-6">
          {restaurant.logoUrl ? (
            <AvatarImage 
              src={restaurant.logoUrl} 
              alt={`${restaurant.name} logo`} 
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="text-2xl">
              {getInitials(restaurant.name)}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex-grow">
          <h2 className="text-xl font-heading font-bold text-dark mb-2">
            {restaurant.name}
          </h2>
          <p className="text-midgray mb-3">{restaurant.description || "No description provided."}</p>
          <div className="flex flex-wrap gap-2">
            {restaurant.tags && restaurant.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-neutral text-midgray font-normal"
              >
                {tag}
              </Badge>
            ))}
            {(!restaurant.tags || restaurant.tags.length === 0) && (
              <Badge variant="secondary" className="bg-neutral text-midgray font-normal">
                {restaurant.cuisine || "Restaurant"}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            variant="ghost" 
            className="text-secondary hover:text-secondary/80 hover:bg-secondary/10 flex items-center"
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
