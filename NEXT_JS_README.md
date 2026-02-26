# Next.js Migration - Quick Start

## 🚀 Installation

1. **Install new dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   copy .env.local.example .env.local
   ```
   Then edit `.env.local` and add your API keys.

3. **Run Next.js development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at: http://localhost:3000

## 📁 What Was Created

### Configuration Files
- ✅ `next.config.ts` - Next.js configuration
- ✅ `tsconfig.json` - Updated with Next.js paths
- ✅ `tailwind.config.ts` - Tailwind CSS v3 config
- ✅ `postcss.config.mjs` - PostCSS configuration
- ✅ `.env.local.example` - Environment variables template

### App Directory (Next.js Routes)
- ✅ `src/app/layout.tsx` - Root layout with StoreProvider
- ✅ `src/app/page.tsx` - Root page (redirects to /landing)
- ✅ `src/app/globals.css` - Global styles
- ✅ All 15 routes converted to App Router structure

### Services (with SSR Safety)
- ✅ `src/lib/services/geminiService.ts` - AI service
- ✅ `src/lib/services/speechRecognitionService.ts` - Speech API (client-only)
- ✅ `src/lib/services/audioService.ts` - Audio recording (client-only)
- ✅ `src/lib/services/sessionStorageService.ts` - Storage (client-only)
- ✅ `src/lib/services/geminiClient.ts` - API route wrapper

### Redux Store (Next.js Compatible)
- ✅ `src/lib/store/store.ts` - Redux store setup
- ✅ `src/lib/store/StoreProvider.tsx` - Client-side provider
- ✅ `src/lib/store/hooks.ts` - Typed Redux hooks

### API Routes (Server-Side)
- ✅ `src/app/api/gemini/generate-question/route.ts`
- ✅ `src/app/api/gemini/generate-feedback/route.ts`

### Middleware
- ✅ `src/middleware.ts` - Route protection

## ⚡ Current Status

### ✅ Completed
1. Next.js project structure
2. Environment variables migration
3. Tailwind CSS configuration
4. Services with SSR checks
5. Redux store with hydration fixes
6. All routes converted to App Router
7. Authentication middleware
8. API routes for Gemini

### 🔄 To Complete
1. **Update component imports** - Replace React Router with Next.js navigation
2. **Add 'use client' directives** - Mark client components
3. **Test all features** - Verify everything works

## 📝 Migration Tasks

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions.

### Quick Component Update Example

If you see errors like "useNavigate is not defined":

**Before (React Router):**
```tsx
import { useNavigate, Link } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  return (
    <Link to="/dashboard">
      <button onClick={() => navigate('/test')}>Go</button>
    </Link>
  );
}
```

**After (Next.js):**
```tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

function MyComponent() {
  const router = useRouter();
  
  return (
    <Link href="/dashboard">
      <button onClick={() => router.push('/test')}>Go</button>
    </Link>
  );
}
```

## 🎯 Running Both Apps

You can run Vite and Next.js simultaneously during migration:

```bash
# Terminal 1: Vite (old app)
npm run dev:vite    # http://localhost:5173

# Terminal 2: Next.js (new app)
npm run dev         # http://localhost:3000
```

## 🐛 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Hydration errors
- Already handled with `suppressHydrationWarning` in layout
- Redux persist properly configured

### API key errors
- Check `.env.local` exists and has correct keys
- Format: `NEXT_PUBLIC_GEMINI_API_KEY=your_key_here`

## 📚 Resources

- Full migration guide: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- Next.js docs: https://nextjs.org/docs
- Need help? Check the migration guide for common issues
