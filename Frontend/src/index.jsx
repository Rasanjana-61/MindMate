import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

// Prevent ethereum property redefinition errors from third-party scripts/extensions
if (typeof window !== 'undefined') {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
    if (!descriptor || (descriptor && descriptor.value === undefined && !window.ethereum)) {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    }
  } catch (e) {
    // Silently ignore - browser extension or another script has defined ethereum
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
