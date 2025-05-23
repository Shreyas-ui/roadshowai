import React from "react";
import { cn } from "@/lib/utils";

interface TokenBadgeProps {
  tokenNumber: string;
  status?: string;
  className?: string;
}

export function TokenBadge({ tokenNumber, status, className }: TokenBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "waiting":
        return "bg-[#F59E0B]";
      case "attending":
        return "bg-[#3B82F6]";
      case "served":
        return "bg-[#10B981]";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <span
      className={cn(
        "px-2 py-1 text-xs font-medium text-white rounded",
        status ? getStatusColor() : "bg-[#4F46E5]",
        className
      )}
    >
      {tokenNumber}
    </span>
  );
}
