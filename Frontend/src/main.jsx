import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n.js";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./context/AuthProvider.jsx";
import CategoriesProvider from "./context/CategoriesProvider.jsx";
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {/* Both sit above the router so their data is fetched once for every
          route. Categories in particular must not be refetched on navigation,
          or the public dropdown would flicker on each page change */}
      <AuthProvider>
        <CategoriesProvider>
          <App />
        </CategoriesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);