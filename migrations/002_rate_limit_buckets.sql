-- Rate limiting: fixed-window counters per IP+route-group
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key TEXT PRIMARY KEY,           -- format: "{ip}:{group}" e.g. "1.2.3.4:auth"
  count INTEGER NOT NULL DEFAULT 1,
  window_start INTEGER NOT NULL   -- Unix timestamp (seconds), aligned to window boundary
);

CREATE INDEX IF NOT EXISTS idx_rlb_window ON rate_limit_buckets(window_start);
