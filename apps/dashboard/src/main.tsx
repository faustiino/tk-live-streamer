import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Importa estilos globais do dashboard
import "./reset.css";

// Importa o CSS do pacote UI (glow da badge etc.)
import "@tk-live/ui/dist/styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root não encontrado");
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
