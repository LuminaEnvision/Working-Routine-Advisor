import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeFarcasterSDK } from "./lib/farcaster-miniapp";
import { Buffer } from "buffer";

// Polyfill Buffer for browser compatibility
if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}

// Initialize Farcaster SDK early (before React renders)
// This is required for Farcaster Mini Apps
initializeFarcasterSDK().catch((error) => {
  console.warn("Farcaster SDK initialization failed (running in standalone mode):", error);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
