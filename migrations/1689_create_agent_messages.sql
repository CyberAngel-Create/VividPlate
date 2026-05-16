-- Migration: create agent_messages table
CREATE TABLE IF NOT EXISTS agent_messages (
  id serial PRIMARY KEY,
  owner_user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id integer NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'open',
  agent_response text,
  owner_viewed boolean DEFAULT true,
  agent_viewed boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  responded_at timestamp
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_agent_messages_owner_user_id ON agent_messages(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_agent_id ON agent_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_status ON agent_messages(status);
