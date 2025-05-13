import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  tooltip?: string;
}

const StatCard = ({ icon, value, label, tooltip }: StatCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900/30 dark:border dark:border-gray-700">
      <div className="text-primary dark:text-primary-light text-2xl mb-2">
        {icon}
      </div>
      <div className="text-dark dark:text-white text-2xl font-bold">{value}</div>
      <div className="flex items-center">
        <div className="text-midgray dark:text-gray-300 text-sm">{label}</div>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-1 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                  <InfoIcon size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default StatCard;
