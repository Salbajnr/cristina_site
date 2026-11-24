import { createRoot } from "react-dom/client";
import { setApiRequestHandler, setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";
import { supabase } from "./lib/supabase";
import { supabaseApiRequest } from "./lib/supabase-api";

if (localStorage.getItem("cristina_theme") === "light") {
  document.documentElement.classList.add("light");
}

setApiRequestHandler(supabaseApiRequest);

setAuthTokenGetter(async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session?.access_token ?? null;
});

createRoot(document.getElementById("root")!).render(<App />);
