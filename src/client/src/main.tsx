import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { SocketProvider } from "./lib/socket";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <SocketProvider>
      <App />
    </SocketProvider>
  </QueryClientProvider>
);
