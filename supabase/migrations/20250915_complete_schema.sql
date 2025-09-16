-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'researcher' CHECK (role IN ('admin', 'researcher', 'observer')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Astrophysical events table
CREATE TABLE astro_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('gravitational_wave', 'gamma_ray_burst', 'optical_transient', 'neutrino', 'radio_burst')),
  ra DECIMAL(10, 7) NOT NULL, -- Right Ascension in degrees
  dec DECIMAL(10, 7) NOT NULL, -- Declination in degrees
  time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  confidence_score DECIMAL(5, 4) DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  magnitude DECIMAL(8, 3),
  error_radius_deg DECIMAL(8, 6),
  follow_up_priority INTEGER DEFAULT 0 CHECK (follow_up_priority >= 0 AND follow_up_priority <= 10),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'invalid')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event correlations table
CREATE TABLE event_correlations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event1_id UUID REFERENCES astro_events(id) ON DELETE CASCADE,
  event2_id UUID REFERENCES astro_events(id) ON DELETE CASCADE,
  time_diff_seconds DECIMAL(12, 6) NOT NULL,
  angular_separation_deg DECIMAL(10, 7) NOT NULL,
  correlation_type TEXT NOT NULL,
  confidence_score DECIMAL(5, 4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  algorithm_version TEXT DEFAULT 'v1.0',
  parameters JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(event1_id, event2_id)
);

-- User saved filters
CREATE TABLE saved_filters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filter_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data exports log
CREATE TABLE data_exports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'json', 'fits')),
  filter_config JSONB,
  record_count INTEGER,
  file_size_bytes BIGINT,
  download_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time subscriptions tracking
CREATE TABLE user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL,
  filter_criteria JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_notification_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_astro_events_time ON astro_events(time_utc);
CREATE INDEX idx_astro_events_type ON astro_events(event_type);
CREATE INDEX idx_astro_events_source ON astro_events(source);
CREATE INDEX idx_astro_events_coords ON astro_events(ra, dec);
CREATE INDEX idx_astro_events_status ON astro_events(status);
CREATE INDEX idx_correlations_events ON event_correlations(event1_id, event2_id);
CREATE INDEX idx_correlations_confidence ON event_correlations(confidence_score);
CREATE INDEX idx_correlations_time_diff ON event_correlations(time_diff_seconds);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE astro_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Astro events: Authenticated users can read all, admins/researchers can write
CREATE POLICY "Authenticated users can view events" ON astro_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Researchers can insert events" ON astro_events
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'researcher')
    )
  );

CREATE POLICY "Researchers can update own events" ON astro_events
  FOR UPDATE USING (
    created_by = auth.uid() OR 
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Event correlations: Authenticated users can read, researchers can write
CREATE POLICY "Authenticated users can view correlations" ON event_correlations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Researchers can manage correlations" ON event_correlations
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('admin', 'researcher')
    )
  );

-- Saved filters: Users can manage their own filters
CREATE POLICY "Users can manage own filters" ON saved_filters
  FOR ALL USING (user_id = auth.uid());

-- Data exports: Users can manage their own exports
CREATE POLICY "Users can manage own exports" ON data_exports
  FOR ALL USING (user_id = auth.uid());

-- User subscriptions: Users can manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON user_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Functions for real-time updates
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_astro_events
  BEFORE UPDATE ON astro_events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_saved_filters
  BEFORE UPDATE ON saved_filters
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert some sample data for development
INSERT INTO astro_events (event_id, source, event_type, ra, dec, time_utc, metadata, confidence_score) VALUES
('GW190814', 'LIGO-Virgo', 'gravitational_wave', 22.7, -31.8, '2019-08-14 21:10:39+00', '{"mass1": 23, "mass2": 2.6, "distance": 241}', 0.95),
('GRB191014C', 'Swift-BAT', 'gamma_ray_burst', 357.9, 45.2, '2019-10-14 01:11:00+00', '{"duration": 2.1, "fluence": 1.2e-6}', 0.88),
('AT2019npv', 'ZTF', 'optical_transient', 23.1, -31.5, '2019-10-15 03:22:15+00', '{"magnitude": 18.2, "filter": "g"}', 0.76),
('IceCube-200109A', 'IceCube', 'neutrino', 164.7, 11.9, '2020-01-09 14:20:32+00', '{"energy": 113, "angular_error": 0.8}', 0.82),
('FRB200428', 'CHIME', 'radio_burst', 284.7, 14.2, '2020-04-28 18:05:12+00', '{"dispersion_measure": 40.5, "width": 2.9}', 0.91);
