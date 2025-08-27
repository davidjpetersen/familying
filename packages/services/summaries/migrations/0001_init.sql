-- Migration: Initialize summaries plugin
-- Created: 2025-08-27T16:03:20.706Z

-- Create plugin-specific tables
CREATE TABLE IF NOT EXISTS summaries_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_summaries_owner ON summaries_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_summaries_created ON summaries_items(created_at);

-- Add RLS policies
ALTER TABLE summaries_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own items
CREATE POLICY "summaries_items_select_policy" ON summaries_items
  FOR SELECT USING (owner_id = auth.uid()::text);

-- Users can only insert their own items
CREATE POLICY "summaries_items_insert_policy" ON summaries_items
  FOR INSERT WITH CHECK (owner_id = auth.uid()::text);

-- Users can only update their own items
CREATE POLICY "summaries_items_update_policy" ON summaries_items
  FOR UPDATE USING (owner_id = auth.uid()::text);

-- Users can only delete their own items
CREATE POLICY "summaries_items_delete_policy" ON summaries_items
  FOR DELETE USING (owner_id = auth.uid()::text);
