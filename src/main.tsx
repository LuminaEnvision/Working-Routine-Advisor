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
// Wrap in try-catch to ensure app loads even if initialization fails
try {
  initializeFarcasterSDK().catch((error) => {
    console.warn("Farcaster SDK initialization failed (running in standalone mode):", error);
  });
} catch (error) {
  console.warn("Farcaster SDK initialization error (app will continue):", error);
}

// Ensure root element exists before rendering
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure index.html has a div with id='root'");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
