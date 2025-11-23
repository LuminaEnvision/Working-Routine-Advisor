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
// Base Build pattern: Check for SDK on window.farcaster.sdk first
(async () => {
  // CRITICAL: Call ready() as early as possible for Base Build
  // Base Build injects SDK on window.farcaster.sdk, so we can call ready() immediately
  if (typeof window !== 'undefined' && window.farcaster?.sdk) {
    const sdk = window.farcaster.sdk;
    console.log('Base Build detected - calling ready() immediately');
    
    // Try to call ready() immediately (Base Build pattern)
    try {
      if (sdk.actions?.ready && typeof sdk.actions.ready === 'function') {
        sdk.actions.ready().then(() => {
          console.log('✅ Farcaster ready() called via sdk.actions.ready() (Base Build)');
        }).catch((err: any) => {
          console.warn('ready() call failed:', err);
        });
      } else if (sdk.ready && typeof sdk.ready === 'function') {
        sdk.ready().then(() => {
          console.log('✅ Farcaster ready() called via sdk.ready() (Base Build)');
        }).catch((err: any) => {
          console.warn('ready() call failed:', err);
        });
      }
    } catch (error) {
      console.warn('Failed to call ready() immediately:', error);
    }
  }

  try {
    // Initialize Farcaster SDK (for other environments)
    const sdkResult = await initializeFarcasterSDK();
    console.log("Farcaster SDK initialized", sdkResult ? "(SDK loaded)" : "(standalone mode)");
    
    // Also try signalAppReady as backup
    if (sdkResult && typeof window !== 'undefined') {
      const { signalAppReady } = await import('./lib/farcaster-miniapp');
      signalAppReady().then((success) => {
        if (success) {
          console.log("✅ Farcaster ready() called via signalAppReady (backup)");
        }
      });
    }
  } catch (error) {
    console.warn("Farcaster SDK initialization failed (running in standalone mode):", error);
  }

  // Render React app
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();
