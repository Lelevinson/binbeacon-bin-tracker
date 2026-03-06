//initializing supa client
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });  //change path to main directory


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('working111');

export default supabase 