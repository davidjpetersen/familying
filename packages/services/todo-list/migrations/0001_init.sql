-- Migration: Initialize todo-list plugin
-- Created: 2025-08-25

-- Create plugin-specific tables
CREATE TABLE IF NOT EXISTS todo_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 1,
  due_date TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_todo_list_owner ON todo_list_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_todo_list_created ON todo_list_items(created_at);
CREATE INDEX IF NOT EXISTS idx_todo_list_due_date ON todo_list_items(due_date);
CREATE INDEX IF NOT EXISTS idx_todo_list_completed ON todo_list_items(completed);

-- Add RLS policies
ALTER TABLE todo_list_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own items
CREATE POLICY "todo_list_items_select_policy" ON todo_list_items
  FOR SELECT USING (owner_id = auth.uid()::text);

-- Users can only insert their own items
CREATE POLICY "todo_list_items_insert_policy" ON todo_list_items
  FOR INSERT WITH CHECK (owner_id = auth.uid()::text);

-- Users can only update their own items
CREATE POLICY "todo_list_items_update_policy" ON todo_list_items
  FOR UPDATE USING (owner_id = auth.uid()::text);

-- Users can only delete their own items
CREATE POLICY "todo_list_items_delete_policy" ON todo_list_items
  FOR DELETE USING (owner_id = auth.uid()::text);
