import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import { store } from "./redux/store.js";
import { CallProvider } from "./context/CallContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
       
        <CallProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </CallProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
