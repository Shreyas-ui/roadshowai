import React from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

interface NavigationTab {
  id: string;
  name: string;
  path: string;
}

const tabs: NavigationTab[] = [
  { id: "dashboard", name: "Dashboard", path: "/" },
  { id: "registration", name: "Registration", path: "/registration" },
  { id: "queue-management", name: "Queue Management", path: "/queue-management" },
  { id: "token-reassignment", name: "Token Reassignment", path: "/token-reassignment" },
];

export default function NavigationTabs() {
  const [location] = useLocation();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <div key={tab.id} className="relative">
              <Link href={tab.path}>
                <span
                  className={cn(
                    "block px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 focus:outline-none cursor-pointer",
                    location === tab.path
                      ? "text-primary border-primary"
                      : "text-gray-500 hover:text-gray-700 border-transparent",
                    tab.id === "dashboard" && "font-bold"
                  )}
                >
                  {tab.id === "dashboard" && location === "/" ? "📊 " : ""}{tab.name}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
