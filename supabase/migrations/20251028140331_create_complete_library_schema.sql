/*
  # Complete Library Management System Schema
  
  ## Overview
  Creates a comprehensive database schema for managing students, books, book issues/returns,
  and transaction history in a college library system - WITHOUT fines.
  
  ## New Tables
  
  ### 1. students
  - `id` (uuid, primary key) - Unique identifier
  - `roll_no` (text, unique, not null) - Student roll number (used for login and identification)
  - `student_id` (text, unique) - Alternate student ID
  - `name` (text, not null) - Student's full name
  - `email` (text, unique, not null) - Student's email
  - `department` (text) - Department name
  - `batch` (text) - Batch year
  - `photo_url` (text, nullable) - Profile photo URL
  - `created_at` (timestamptz) - Registration timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. books
  - `id` (uuid, primary key) - Unique identifier
  - `book_id` (text, unique, not null) - Library catalog book ID
  - `book_name` (text, not null) - Book title
  - `author` (text, not null) - Author name
  - `photo_url` (text, nullable) - Book cover image URL
  - `total_count` (integer) - Total copies in library
  - `available_count` (integer) - Available copies
  - `created_at` (timestamptz) - Added timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 3. issued_books
  - `id` (uuid, primary key) - Unique record ID
  - `student_id` (text, foreign key) - References students.roll_no
  - `book_id` (text, foreign key) - References books.book_id
  - `issue_date` (timestamptz) - Issue timestamp
  - `return_date` (timestamptz, nullable) - Return timestamp
  - `return_status` (text) - Status: 'issued' or 'returned'
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update
  
  ### 4. transactions
  - `id` (uuid, primary key) - Transaction ID
  - `student_id` (text, foreign key) - References students.roll_no
  - `book_id` (text, foreign key) - References books.book_id
  - `action_type` (text) - Type: 'issue' or 'return'
  - `notes` (text, nullable) - Additional notes
  - `created_at` (timestamptz) - Transaction timestamp
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Authenticated users can perform all operations
  
  ## Important Notes
  - NO fine system implemented
  - Maximum 3 books per student enforced in application logic
  - Uses roll_no as primary student identifier
  - Uses book_id as primary book identifier
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no text UNIQUE NOT NULL,
  student_id text UNIQUE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  department text,
  batch text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text UNIQUE NOT NULL,
  book_name text NOT NULL,
  author text NOT NULL,
  photo_url text,
  total_count integer DEFAULT 1,
  available_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create issued_books table (NO fines)
CREATE TABLE IF NOT EXISTS issued_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  book_id text NOT NULL,
  issue_date timestamptz DEFAULT now(),
  return_date timestamptz,
  return_status text DEFAULT 'issued' CHECK (return_status IN ('issued', 'returned')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(roll_no) ON DELETE CASCADE,
  CONSTRAINT fk_book FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

-- Create transactions table (NO fines)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  book_id text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('issue', 'return')),
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_transaction_student FOREIGN KEY (student_id) REFERENCES students(roll_no) ON DELETE CASCADE,
  CONSTRAINT fk_transaction_book FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_books_book_id ON books(book_id);
CREATE INDEX IF NOT EXISTS idx_issued_books_student_id ON issued_books(student_id);
CREATE INDEX IF NOT EXISTS idx_issued_books_book_id ON issued_books(book_id);
CREATE INDEX IF NOT EXISTS idx_issued_books_return_status ON issued_books(return_status);
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions(book_id);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Authenticated users can view all students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for books table
CREATE POLICY "Authenticated users can view all books"
  ON books FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update books"
  ON books FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete books"
  ON books FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for issued_books table
CREATE POLICY "Authenticated users can view all issued books"
  ON issued_books FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert issued books"
  ON issued_books FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update issued books"
  ON issued_books FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete issued books"
  ON issued_books FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for transactions table
CREATE POLICY "Authenticated users can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issued_books_updated_at BEFORE UPDATE ON issued_books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
