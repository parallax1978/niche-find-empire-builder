// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://orbxoshntxwspdzokcdi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYnhvc2hudHh3c3Bkem9rY2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzOTAzMDYsImV4cCI6MjA1OTk2NjMwNn0.6F89Z4dkoUHafH0QAgu35ayeNE9_A9PQ6XaaV04zi-U";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);