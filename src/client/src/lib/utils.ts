import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";

// Utility function for combining Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "PPP");
}

// Format time
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "p");
}

// Format date and time
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "PPp");
}

// Format relative time (e.g., "5 minutes ago")
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

// Get status color based on token status
export function getStatusColor(status: string): string {
  switch (status) {
    case "waiting":
      return "bg-[#F59E0B] text-white";
    case "attending":
      return "bg-[#3B82F6] text-white";
    case "served":
      return "bg-[#10B981] text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

// Get status badge color based on token status
export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "waiting":
      return "bg-yellow-100 text-yellow-800";
    case "attending":
      return "bg-blue-100 text-blue-800";
    case "served":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Generate a formatted current date and time
export function getCurrentDateTime(): string {
  return format(new Date(), "PPp");
}

// Capitalize the first letter of a string
export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
