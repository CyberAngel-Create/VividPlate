import { Link } from "wouter";
import { Store, ChevronRight, PlusCircle } from "lucide-react";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useSubscription } from "@/hooks/use-subscription";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const RestaurantOwnerHeader = () => {
  const { restaurants, activeRestaurant, setActiveRestaurant } = useRestaurant();
  const { isPaid } = useSubscription();
  const { t } = useTranslation();

  // Check if the user can add more restaurants (premium users can add up to 3)
  const canAddRestaurant = isPaid && restaurants && restaurants.length < 3;

  if (!restaurants || restaurants.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
      <div className="pl-0 lg:pl-52">
        <div className="flex flex-col">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Current Restaurant</p>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-between p-2 text-left rounded-md border dark:border-gray-700 bg-white dark:bg-gray-800 w-full lg:max-w-[calc(100%-52px)]">
              <div className="flex items-center gap-2 truncate">
                <Store className="h-4 w-4 flex-shrink-0" />
                <span className="truncate text-sm">
                  {activeRestaurant ? activeRestaurant.name : t("Select Restaurant")}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 dark:bg-gray-800 dark:border-gray-700">
              <DropdownMenuLabel className="dark:text-gray-300">{t("Your Restaurants")}</DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:border-gray-700" />
              {restaurants.map((restaurant) => (
                <DropdownMenuItem 
                  key={restaurant.id}
                  onClick={() => setActiveRestaurant(restaurant.id)}
                  className={`cursor-pointer ${
                    activeRestaurant?.id === restaurant.id 
                      ? 'bg-gray-100 dark:bg-gray-700 font-medium' 
                      : 'dark:text-gray-200'
                  } cursor-pointer dark:hover:bg-gray-700`}
                >
                  <span className="truncate max-w-[250px]">{restaurant.name}</span>
                </DropdownMenuItem>
              ))}
              {canAddRestaurant && (
                <>
                  <DropdownMenuSeparator className="dark:border-gray-700" />
                  <Link href="/edit-restaurant">
                    <DropdownMenuItem className="cursor-pointer text-primary dark:text-primary-light font-medium">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {t("Create Restaurant")}
                    </DropdownMenuItem>
                  </Link>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOwnerHeader;