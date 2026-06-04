import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfkqvykvmstlnrziadwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpma3F2eWt2bXN0bG5yemlhZHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1ODY2MzEsImV4cCI6MjA5MjE2MjYzMX0.nykYwrywfJKmaDWw1BtLBxejSDwk67LWpQCDluB7wGs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

supabase.auth.getSession().then(res => {
  console.log("getSession resolved:", res);
}).catch(err => {
  console.error("getSession rejected:", err);
});
