import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";
import { supabase } from "./lib/supabase";

if (localStorage.getItem("cristina_theme") === "light") {
  document.documentElement.classList.add("light");
}

// Configure API base URL for development
if (import.meta.env.MODE === "development") {
  setBaseUrl("http://localhost:3000");
}

setAuthTokenGetter(async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session?.access_token ?? null;
});

createRoot(document.getElementById("root")!).render(<App />);
