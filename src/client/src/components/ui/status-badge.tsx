import React from "react";
import { cn, capitalizeFirstLetter } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "waiting":
        return {
          container: "bg-yellow-100 text-yellow-800",
          dot: "bg-[#F59E0B]"
        };
      case "attending":
        return {
          container: "bg-blue-100 text-blue-800",
          dot: "bg-[#3B82F6]"
        };
      case "served":
        return {
          container: "bg-green-100 text-green-800",
          dot: "bg-[#10B981]"
        };
      default:
        return {
          container: "bg-gray-100 text-gray-800",
          dot: "bg-gray-500"
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        styles.container,
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full mr-1.5", styles.dot)}></span>
      {capitalizeFirstLetter(status)}
    </span>
  );
}
