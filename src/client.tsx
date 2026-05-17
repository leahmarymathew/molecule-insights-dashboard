import "./styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RootLayout } from "./pages/RootLayout";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RootLayout />);
}
