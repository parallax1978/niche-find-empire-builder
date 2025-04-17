
import { createRoot } from 'react-dom/client';
import { supabase } from "@/integrations/supabase/client";
import App from './App.tsx';
import './index.css';

// Initialize Supabase session check on app load
const initializeApp = async () => {
  try {
    // Just to ensure session is loaded properly before rendering
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error initializing auth:", error);
    } else {
      console.log("Auth initialized, user is " + (data.session ? "logged in" : "logged out"));
    }
  } catch (err) {
    console.error("Unexpected error during auth initialization:", err);
  }
  
  // Render app regardless of auth state
  createRoot(document.getElementById("root")!).render(<App />);
};

initializeApp();
