# Social AI Agent

An AI-powered platform that automates the creation of engaging, platform-specific content for social media platforms including Facebook, Instagram, YouTube, Twitter/X, TikTok, and LinkedIn.

## Features

- **Multi-Platform Content Generation**: Create optimized posts for 6+ social media platforms
- **AI-Powered Content**: Uses Google Gemini API for intelligent content generation
- **Brand-Aware**: Maintains consistent brand tone and voice across platforms
- **Media Upload**: Support for images and videos with cloud storage
- **Real-time Preview**: See how your posts will look on each platform
- **Export & Copy**: Easy content export and clipboard functionality
- **Data Persistence**: Save companies and posts with Supabase backend

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Google Gemini API
- **Icons**: Lucide React
- **Build Tool**: Vite

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gemini API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Run the migration file to set up the database schema:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and run the contents of `supabase/migrations/create_initial_schema.sql`

### 3. Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the API key to your `.env` file

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

## Usage

1. **Company Setup**: Enter your company information, brand tone, and target platforms
2. **Content Input**: Upload media (optional) and describe your content
3. **AI Generation**: Watch as AI creates platform-specific posts
4. **Preview & Export**: Review, copy, and download your generated content

## Platform-Specific Features

- **Facebook**: Conversational tone, community engagement focus
- **Instagram**: Visual-first content with optimal hashtag usage
- **Twitter/X**: Concise, trending-aware content
- **LinkedIn**: Professional tone with industry insights
- **TikTok**: Trendy, viral-optimized content
- **YouTube**: Educational descriptions with SEO optimization

## Database Schema

### Companies Table
- Company information and brand settings
- User-specific data with RLS policies

### Posts Table
- Generated content and metadata
- Links to company profiles
- JSON storage for platform-specific posts

### Storage
- Media files with user-specific access
- Automatic URL generation for uploads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details