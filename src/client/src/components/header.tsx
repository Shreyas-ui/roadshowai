import React, { useState, useEffect } from "react";
import { cn, getCurrentDateTime } from "@/lib/utils";
import { useSocket } from "@/lib/socket";

export default function Header() {
  const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime());
  const { connected } = useSocket();

  useEffect(() => {
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentDateTime(getCurrentDateTime());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
              AI
            </div>
            <h1 className="ml-3 text-xl font-bold text-gray-900">AI Roadshow Token System</h1>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-500">{currentDateTime}</span>
            <div className="flex items-center">
              <span className={cn(
                "text-xs font-medium px-2.5 py-0.5 rounded-full",
                connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              )}>
                {connected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
