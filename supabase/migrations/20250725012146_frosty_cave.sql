/*
  # Create observation_templates table

  1. New Tables
    - `observation_templates`
      - `id` (uuid, primary key)
      - `coach_id` (uuid, foreign key to users)
      - `name` (text, template name)
      - `content` (text, template content)
      - `category` (text, optional category)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `observation_templates` table
    - Add policies for coaches to manage their own templates

  3. Features
    - Auto-update trigger for updated_at field
    - Indexes for performance
*/

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create observation_templates table
CREATE TABLE IF NOT EXISTS public.observation_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    content text NOT NULL,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.observation_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Coaches can view their own observation templates"
ON public.observation_templates FOR SELECT
TO authenticated
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert their own observation templates"
ON public.observation_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own observation templates"
ON public.observation_templates FOR UPDATE
TO authenticated
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own observation templates"
ON public.observation_templates FOR DELETE
TO authenticated
USING (auth.uid() = coach_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_observation_templates_updated_at
    BEFORE UPDATE ON public.observation_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS observation_templates_coach_id_idx 
ON public.observation_templates(coach_id);

CREATE INDEX IF NOT EXISTS observation_templates_category_idx 
ON public.observation_templates(category);