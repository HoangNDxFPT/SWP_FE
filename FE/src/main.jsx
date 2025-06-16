import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { store } from "./redux/store.js";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { GoogleOAuthProvider } from "@react-oauth/google";

// ⚠️ Client ID của bạn
const CLIENT_ID = "271590491401-jpct9cg37n7hrhpr43clhvfam12av9fd.apps.googleusercontent.com";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Provider store={store}>
        <App />
        <ToastContainer />
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>
);
