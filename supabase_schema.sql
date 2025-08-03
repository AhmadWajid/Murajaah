-- MQuran Database Schema
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security (RLS) on all tables
-- This ensures users can only access their own data

-- =============================================
-- USERS TABLE (handled by Supabase Auth)
-- =============================================
-- Note: Users are automatically managed by Supabase Auth
-- The auth.users table is created automatically

-- =============================================
-- USER PROFILES TABLE
-- =============================================
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can only view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can only update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- MEMORIZATION ITEMS TABLE
-- =============================================
CREATE TABLE public.memorization_items (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    surah INTEGER NOT NULL CHECK (surah >= 1 AND surah <= 114),
    ayah_start INTEGER NOT NULL CHECK (ayah_start >= 1),
    ayah_end INTEGER NOT NULL CHECK (ayah_end >= 1),
    interval_days INTEGER NOT NULL DEFAULT 1,
    next_review DATE NOT NULL,
    ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.5,
    review_count INTEGER NOT NULL DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    completed_today DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    memorization_age INTEGER,
    individual_ratings JSONB DEFAULT '{}',
    individual_recall_quality JSONB DEFAULT '{}',
    ruku_start INTEGER,
    ruku_end INTEGER,
    ruku_count INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    name TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_ayah_range CHECK (ayah_end >= ayah_start),
    CONSTRAINT valid_ease_factor CHECK (ease_factor >= 1.3 AND ease_factor <= 3.0)
);

-- Create indexes for performance
CREATE INDEX idx_memorization_items_user_id ON public.memorization_items(user_id);
CREATE INDEX idx_memorization_items_next_review ON public.memorization_items(next_review);
CREATE INDEX idx_memorization_items_surah ON public.memorization_items(surah);
CREATE INDEX idx_memorization_items_created_at ON public.memorization_items(created_at);

-- Enable RLS
ALTER TABLE public.memorization_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for memorization_items
CREATE POLICY "Users can only access their own memorization items" ON public.memorization_items
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- MISTAKES TABLE
-- =============================================
CREATE TABLE public.mistakes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    surah INTEGER NOT NULL CHECK (surah >= 1 AND surah <= 114),
    ayah INTEGER NOT NULL CHECK (ayah >= 1),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate mistakes for same ayah
    UNIQUE(user_id, surah, ayah)
);

-- Create indexes
CREATE INDEX idx_mistakes_user_id ON public.mistakes(user_id);
CREATE INDEX idx_mistakes_surah_ayah ON public.mistakes(surah, ayah);
CREATE INDEX idx_mistakes_timestamp ON public.mistakes(timestamp);

-- Enable RLS
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mistakes
CREATE POLICY "Users can only access their own mistakes" ON public.mistakes
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- USER SETTINGS TABLE
-- =============================================
CREATE TABLE public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Reciter settings
    selected_reciter TEXT DEFAULT 'ar.alafasy',
    
    -- Display settings
    hide_mistakes BOOLEAN DEFAULT FALSE,
    last_page INTEGER DEFAULT 1 CHECK (last_page >= 1 AND last_page <= 604),
    
    -- Font settings
    arabic_font_size INTEGER DEFAULT 24 CHECK (arabic_font_size >= 12 AND arabic_font_size <= 48),
    translation_font_size INTEGER DEFAULT 20 CHECK (translation_font_size >= 12 AND translation_font_size <= 48),
    font_target_arabic BOOLEAN DEFAULT TRUE,
    font_size INTEGER DEFAULT 24 CHECK (font_size >= 12 AND font_size <= 48),
    padding INTEGER DEFAULT 16 CHECK (padding >= 8 AND padding <= 32),
    layout_mode TEXT DEFAULT 'single' CHECK (layout_mode IN ('single', 'spread')),
    selected_language TEXT DEFAULT 'en',
    selected_translation TEXT DEFAULT 'en.hilali',
    enable_tajweed BOOLEAN DEFAULT TRUE,
    
    -- Audio settings
    audio_loop_mode TEXT DEFAULT 'none',
    audio_custom_loop JSONB DEFAULT '{}',
    audio_playback_speed DECIMAL(3,2) DEFAULT 1.0 CHECK (audio_playback_speed >= 0.5 AND audio_playback_speed <= 2.0),
    
    -- UI settings
    show_word_by_word_tooltip BOOLEAN DEFAULT FALSE,
    mobile_header_hidden BOOLEAN DEFAULT FALSE,
    user_timezone TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can only access their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- STORAGE METADATA TABLE
-- =============================================
CREATE TABLE public.storage_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_storage_metadata_user_id ON public.storage_metadata(user_id);

-- Enable RLS
ALTER TABLE public.storage_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for storage_metadata
CREATE POLICY "Users can only access their own metadata" ON public.storage_metadata
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    INSERT INTO public.storage_metadata (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_memorization_items_updated_at
    BEFORE UPDATE ON public.memorization_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_storage_metadata_updated_at
    BEFORE UPDATE ON public.storage_metadata
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- HELPFUL VIEWS
-- =============================================

-- View for due items (items that need review today or are overdue)
CREATE VIEW public.due_items AS
SELECT 
    mi.*,
    CASE 
        WHEN mi.next_review <= CURRENT_DATE THEN 'due'
        WHEN mi.next_review <= CURRENT_DATE + INTERVAL '1 day' THEN 'upcoming'
        ELSE 'future'
    END as review_status
FROM public.memorization_items mi
WHERE mi.next_review <= CURRENT_DATE + INTERVAL '1 day'
ORDER BY mi.next_review ASC, mi.created_at ASC;

-- View for recent mistakes
CREATE VIEW public.recent_mistakes AS
SELECT 
    m.*,
    EXTRACT(DAYS FROM NOW() - m.timestamp) as days_ago
FROM public.mistakes m
ORDER BY m.timestamp DESC;

-- =============================================
-- SECURITY NOTES
-- =============================================
-- 1. Row Level Security (RLS) is enabled on all tables
-- 2. All policies ensure users can only access their own data
-- 3. Foreign key constraints ensure data integrity
-- 4. Check constraints validate data ranges
-- 5. Unique constraints prevent duplicate data where appropriate
-- 6. Automatic triggers handle user creation and timestamp updates
-- 7. All sensitive operations use SECURITY DEFINER for controlled access

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions on views
GRANT SELECT ON public.due_items TO authenticated;
GRANT SELECT ON public.recent_mistakes TO authenticated;