import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

// Prevent ethereum property redefinition errors from third-party scripts/extensions
if (typeof window !== 'undefined') {
  try {
    if (!window.ethereum) {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    }
  } catch (e) {
    console.warn('Could not define ethereum property:', e);
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
