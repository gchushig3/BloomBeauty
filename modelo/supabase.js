// Modelo/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://pqvqerwuhgvmeivattje.supabase.co'
const supabaseKey = 'sb_publishable_7bfDRWuDFEo5xrbLoASyCg_pnAfAzTh'

export const supabase = createClient(supabaseUrl, supabaseKey)