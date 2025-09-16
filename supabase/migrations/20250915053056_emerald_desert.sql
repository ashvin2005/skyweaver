/*
  # Create Astrophysical Events Database Schema

  1. New Tables
    - `astro_events`
      - `id` (uuid, primary key)
      - `event_id` (text, unique identifier from source)
      - `source` (text, observatory/instrument name)
      - `event_type` (text, type of astrophysical event)
      - `ra` (numeric, right ascension in degrees)
      - `dec` (numeric, declination in degrees)
      - `time_utc` (timestamptz, event detection time)
      - `metadata` (jsonb, additional event-specific data)
      - `confidence_score` (numeric, optional confidence score)
      - `created_at` (timestamptz, record creation time)
    
    - `event_correlations`
      - `id` (uuid, primary key)
      - `event1_id` (uuid, foreign key to astro_events)
      - `event2_id` (uuid, foreign key to astro_events)
      - `time_diff_seconds` (numeric, time difference between events)
      - `angular_separation_deg` (numeric, angular separation in degrees)
      - `correlation_type` (text, type of correlation)
      - `confidence_score` (numeric, correlation confidence)
      - `created_at` (timestamptz, correlation creation time)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read and write data
    - Add policies for anonymous users to read data (for demo purposes)

  3. Indexes
    - Add indexes for efficient querying by time, position, and event type
*/

-- Create astro_events table
CREATE TABLE IF NOT EXISTS astro_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  source text NOT NULL,
  event_type text NOT NULL,
  ra numeric NOT NULL CHECK (ra >= 0 AND ra <= 360),
  dec numeric NOT NULL CHECK (dec >= -90 AND dec <= 90),
  time_utc timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}',
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz DEFAULT now()
);

-- Create event_correlations table
CREATE TABLE IF NOT EXISTS event_correlations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event1_id uuid NOT NULL REFERENCES astro_events(id) ON DELETE CASCADE,
  event2_id uuid NOT NULL REFERENCES astro_events(id) ON DELETE CASCADE,
  time_diff_seconds numeric NOT NULL CHECK (time_diff_seconds >= 0),
  angular_separation_deg numeric NOT NULL CHECK (angular_separation_deg >= 0),
  correlation_type text NOT NULL,
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_events CHECK (event1_id != event2_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_astro_events_time_utc ON astro_events(time_utc);
CREATE INDEX IF NOT EXISTS idx_astro_events_event_type ON astro_events(event_type);
CREATE INDEX IF NOT EXISTS idx_astro_events_source ON astro_events(source);
CREATE INDEX IF NOT EXISTS idx_astro_events_ra_dec ON astro_events(ra, dec);
CREATE INDEX IF NOT EXISTS idx_event_correlations_event1 ON event_correlations(event1_id);
CREATE INDEX IF NOT EXISTS idx_event_correlations_event2 ON event_correlations(event2_id);
CREATE INDEX IF NOT EXISTS idx_event_correlations_confidence ON event_correlations(confidence_score);

-- Enable Row Level Security
ALTER TABLE astro_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_correlations ENABLE ROW LEVEL SECURITY;

-- Create policies for astro_events
CREATE POLICY "Allow anonymous read access to astro_events"
  ON astro_events
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated read access to astro_events"
  ON astro_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to astro_events"
  ON astro_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to astro_events"
  ON astro_events
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for event_correlations
CREATE POLICY "Allow anonymous read access to event_correlations"
  ON event_correlations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated read access to event_correlations"
  ON event_correlations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert to event_correlations"
  ON event_correlations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to event_correlations"
  ON event_correlations
  FOR UPDATE
  TO authenticated
  USING (true);