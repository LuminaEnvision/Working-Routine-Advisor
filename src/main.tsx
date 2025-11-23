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

// Ensure root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure index.html has a div with id='root'");
}

// Initialize Farcaster SDK and render app
// This ensures sdk.actions.ready() is called before React renders
(async () => {
  try {
    // Initialize Farcaster SDK first (required for Mini Apps)
    await initializeFarcasterSDK();
    console.log("Farcaster SDK initialized successfully");
  } catch (error) {
    console.warn("Farcaster SDK initialization failed (running in standalone mode):", error);
  }
  
  // Render React app after SDK is ready
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();
