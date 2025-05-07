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
        "bg-gradient-to-r from-amber-400 to-amber-500",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showIcon && (
        <Star className={cn("mr-1 fill-white", {
          "h-3 w-3": size === "sm",
          "h-4 w-4": size === "md",
          "h-5 w-5": size === "lg",
        })} />
      )}
      Premium Member
    </div>
  );
};