import { WebSocketMessage } from "@shared/schema";
import { queryClient } from "./queryClient";
import { useEffect, ReactNode } from "react";

// A simplified socket implementation without context
let socketInstance: WebSocket | null = null;
let isConnected = false;

// Initialize the WebSocket connection
function initializeSocket() {
  if (socketInstance) return;
  
  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socketInstance = new WebSocket(wsUrl);
    
    socketInstance.onopen = () => {
      console.log("WebSocket connected");
      isConnected = true;
    };
    
    socketInstance.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socketInstance.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    socketInstance.onclose = () => {
      console.log("WebSocket disconnected");
      isConnected = false;
      socketInstance = null;
    };
  } catch (error) {
    console.error("Failed to initialize WebSocket:", error);
  }
}

// Send message through the WebSocket
export function sendSocketMessage(message: WebSocketMessage) {
  if (!socketInstance || socketInstance.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket not connected. Cannot send message.");
    return;
  }
  
  socketInstance.send(JSON.stringify(message));
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(message: WebSocketMessage) {
  switch (message.type) {
    case "INITIAL_DATA":
      queryClient.setQueryData(["/api/booths"], message.payload.booths);
      queryClient.setQueryData(["/api/booths/status"], message.payload.boothStatuses);
      queryClient.setQueryData(["/api/dashboard/stats"], message.payload.dashboardStats);
      break;
    case "TOKEN_CREATED":
      // Invalidate queries that might be affected by a new token
      queryClient.invalidateQueries({ queryKey: ["/api/booths/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      // If we have the tokens for this booth, add this token
      const boothId = message.payload.boothId;
      queryClient.invalidateQueries({ queryKey: [`/api/booths/${boothId}/tokens`] });
      break;
    case "TOKEN_UPDATED":
      // Invalidate queries that might be affected by a token update
      queryClient.invalidateQueries({ queryKey: ["/api/booths/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      // Update the specific booth's tokens
      const updatedBoothId = message.payload.boothId;
      queryClient.invalidateQueries({ queryKey: [`/api/booths/${updatedBoothId}/tokens`] });
      break;
    case "TOKEN_REASSIGNED":
      // Invalidate queries that might be affected by a token reassignment
      queryClient.invalidateQueries({ queryKey: ["/api/booths/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      // Update tokens for both source and destination booths
      const fromBoothId = message.payload.fromBoothId;
      const toBoothId = message.payload.token.boothId;
      queryClient.invalidateQueries({ queryKey: [`/api/booths/${fromBoothId}/tokens`] });
      queryClient.invalidateQueries({ queryKey: [`/api/booths/${toBoothId}/tokens`] });
      // Update reassignment history
      queryClient.invalidateQueries({ queryKey: ["/api/reassignments"] });
      break;
    case "BOOTH_UPDATED":
      // Update all booth statuses
      queryClient.setQueryData(["/api/booths/status"], message.payload);
      break;
    case "DASHBOARD_UPDATED":
      // Update dashboard stats
      queryClient.setQueryData(["/api/dashboard/stats"], message.payload);
      break;
    default:
      console.warn("Unknown WebSocket message type:", message.type);
  }
}

// Hook to provide socket functionality
export function useSocket() {
  return {
    connected: isConnected,
    sendMessage: sendSocketMessage
  };
}

// Socket Provider wrapper component
type SocketProviderProps = {
  children: ReactNode;
};

export function SocketProvider({ children }: SocketProviderProps) {
  useEffect(() => {
    initializeSocket();
    
    return () => {
      if (socketInstance) {
        socketInstance.close();
        socketInstance = null;
        isConnected = false;
      }
    };
  }, []);
  
  return children;
}
