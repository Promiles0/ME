-- Projects shown on the site. JSON arrays are stored as TEXT.
CREATE TABLE IF NOT EXISTS projects (
  slug          TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  tagline       TEXT NOT NULL DEFAULT '',
  summary       TEXT NOT NULL,
  highlights    TEXT NOT NULL DEFAULT '[]',
  tech_stack    TEXT NOT NULL DEFAULT '[]',
  repo_url      TEXT,
  demo_url      TEXT,
  image_url     TEXT NOT NULL DEFAULT '',
  video_url     TEXT,
  is_private    INTEGER NOT NULL DEFAULT 0,
  embeddable    INTEGER NOT NULL DEFAULT 0,
  featured      INTEGER NOT NULL DEFAULT 0,
  published     INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 100,
  year          TEXT NOT NULL DEFAULT '',
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS projects_order_idx ON projects (published, display_order);

-- Messages from the contact form. Only the Worker can write; nothing reads them publicly.
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  ip_hash    TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS contact_ip_time_idx ON contact_messages (ip_hash, created_at);
