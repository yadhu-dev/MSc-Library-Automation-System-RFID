import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Students Table
export interface Student {
  id?: string;
  roll_no: string;
  student_id?: string;
  name: string;
  email: string;
  department?: string;
  batch?: string;
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Books Table
export interface Book {
  id?: string;
  book_id: string;
  book_name: string;
  author: string;
  photo_url?: string | null;
  total_count: number;
  available_count: number;
  created_at?: string;
  updated_at?: string;
}

// Issued Books Table (NO fines)
export interface IssuedBook {
  id?: string;
  book_id: string;
  student_id: string;
  issue_date: string;
  return_date?: string | null;
  return_status: "issued" | "returned";
  created_at?: string;
  updated_at?: string;
  books?: Book;
  students?: Student;
}

// Transactions Table (NO fines)
export interface Transaction {
  id?: string;
  student_id: string;
  book_id: string;
  action_type: "issue" | "return";
  notes?: string | null;
  created_at?: string;
  books?: Book;
  students?: Student;
}
