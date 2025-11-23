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
// Base Build pattern: SDK is injected by Base, we need to call ready() when app is ready
(async () => {
  // Render React app first
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // After React renders, try to call ready()
  // Use a small delay to ensure DOM is ready
  setTimeout(() => {
    const callReady = async () => {
      // Method 1: Check window.farcaster.sdk (Base Build pattern)
      if (typeof window !== 'undefined' && window.farcaster?.sdk) {
        const sdk = window.farcaster.sdk;
        console.log('🔍 Base Build SDK detected, attempting ready() call...');
        console.log('SDK structure:', Object.keys(sdk || {}));
        
        try {
          // Try sdk.actions.ready() first (most common)
          if (sdk.actions?.ready && typeof sdk.actions.ready === 'function') {
            await sdk.actions.ready();
            console.log('✅ ready() called via sdk.actions.ready()');
            return;
          }
          
          // Try sdk.ready()
          if (sdk.ready && typeof sdk.ready === 'function') {
            await sdk.ready();
            console.log('✅ ready() called via sdk.ready()');
            return;
          }
          
          // Try direct ready property
          if (typeof (sdk as any).ready === 'function') {
            await (sdk as any).ready();
            console.log('✅ ready() called via direct ready()');
            return;
          }
          
          console.warn('⚠️ SDK found but ready() method not found. SDK keys:', Object.keys(sdk));
        } catch (error) {
          console.error('❌ Error calling ready():', error);
        }
      }

      // Method 2: Try importing SDK and calling ready()
      try {
        const { signalAppReady } = await import('./lib/farcaster-miniapp');
        const success = await signalAppReady();
        if (success) {
          console.log('✅ ready() called via signalAppReady()');
        } else {
          console.warn('⚠️ signalAppReady() returned false');
        }
      } catch (error) {
        console.error('❌ signalAppReady() failed:', error);
      }
    };

    callReady();
  }, 100);
})();
