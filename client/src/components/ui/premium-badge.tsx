import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export const PremiumBadge = ({
  className,
  showIcon = true,
  size = "md",
  ...props
}: PremiumBadgeProps) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium text-white",
        "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
        "shadow-md shadow-amber-200/50 dark:shadow-amber-900/30",
        "border border-amber-300/50 dark:border-amber-700/50",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showIcon && (
        <Star className={cn("mr-1 fill-amber-100 drop-shadow-sm", {
          "h-3 w-3": size === "sm",
          "h-4 w-4": size === "md",
          "h-5 w-5": size === "lg",
        })} />
      )}
      <span className="font-semibold drop-shadow-sm bg-clip-text text-transparent bg-gradient-to-b from-white to-amber-100">
        Premium Member
      </span>
    </div>
  );
};