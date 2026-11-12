-- One-word guestbook: each word becomes a cluster of grains in the sky section.
CREATE TABLE IF NOT EXISTS guestbook (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  word       TEXT NOT NULL,
  ip_hash    TEXT,
  hidden     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS guestbook_recent_idx ON guestbook (hidden, id DESC);
CREATE INDEX IF NOT EXISTS guestbook_ip_time_idx ON guestbook (ip_hash, created_at);

-- A few words to start the sky.
INSERT INTO guestbook (word) VALUES ('hello'), ('murakoze'), ('ship it'), ('kigali'), ('wow');
