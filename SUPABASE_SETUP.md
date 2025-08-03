# Supabase Setup Guide for MQuran

## 🚀 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be provisioned (2-3 minutes)

### 2. Run Database Schema
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase_schema.sql` 
4. Click "RUN" to execute the schema

### 3. Configure Environment Variables
1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```
3. In your Supabase dashboard, go to Settings > API
4. Copy the values:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your anon/public key

### 4. Test the Setup
1. Start your development server:
   ```bash
   npm run dev
   ```
2. Visit `http://localhost:3000`
3. You should be redirected to `/auth`
4. Create an account or sign in

## 🔒 Security Features

### Row Level Security (RLS)
- ✅ All tables have RLS enabled
- ✅ Users can only access their own data
- ✅ Automatic user profile creation on signup
- ✅ Secure data isolation between users

### Data Validation
- ✅ Surah numbers (1-114)
- ✅ Ayah numbers (positive integers)
- ✅ Ease factors (1.3-3.0)
- ✅ Font sizes (12-48)
- ✅ Valid data types and constraints

## 📊 Database Schema Overview

### Tables Created:
1. **user_profiles** - User profile information
2. **memorization_items** - Quran memorization data with spaced repetition
3. **mistakes** - Ayah mistake tracking
4. **user_settings** - All user preferences and settings
5. **storage_metadata** - Sync metadata

### Views Created:
1. **due_items** - Items due for review
2. **recent_mistakes** - Recent mistakes with time tracking

## 🔄 Data Migration

### Automatic Migration
- When a user first logs in, they'll see a migration prompt
- All localStorage data will be transferred to the database
- Original data remains safe in localStorage
- Migration can be skipped if desired

### Manual Migration
If you want to migrate data programmatically:
```javascript
import { migrateToDatabase } from '@/lib/storageService';

await migrateToDatabase();
```

## 🎯 Features Preserved

### ✅ All Original Functionality
- Spaced repetition system
- Mistake tracking
- Audio settings
- Font preferences
- Last page memory
- Import/Export functionality
- Statistics and analytics

### ✅ Enhanced with Cloud Features
- Cross-device synchronization
- Secure user authentication
- Data backup and recovery
- Google OAuth integration
- Real-time data updates

## 🛠️ Development Notes

### Storage Service
The app uses a unified storage service (`src/lib/storageService.ts`) that:
- Automatically detects authentication state
- Falls back to localStorage when offline/unauthenticated
- Provides seamless transition between storage methods

### Error Handling
- All database operations include try-catch blocks
- Graceful fallback to localStorage on errors
- User-friendly error messages
- Console logging for debugging

## 🔧 Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env.local` file
   - Ensure variables are correctly named
   - Restart development server after changes

2. **"User not authenticated"**
   - User needs to sign up/login first
   - Check middleware configuration
   - Verify auth flow in browser dev tools

3. **"RLS policy violation"**
   - Usually means user is not properly authenticated
   - Check user session in Supabase dashboard
   - Verify RLS policies are correctly applied

4. **Migration Issues**
   - Check browser console for errors
   - Verify localStorage has data to migrate
   - Test database connection first

### Database Monitoring
Use Supabase dashboard to:
- Monitor query performance
- Check table data
- View authentication logs
- Analyze usage patterns

## 📈 Next Steps

1. **Authentication Providers**: Add more OAuth providers (GitHub, Apple, etc.)
2. **Offline Support**: Implement progressive web app features
3. **Real-time Sync**: Add real-time collaboration features
4. **Analytics**: Enhanced tracking and insights
5. **Mobile App**: React Native version with shared database