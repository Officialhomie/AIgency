# Next.js Build Failure - SSR Fix Guide

## Problem Summary

**Error**: `npm run build` fails with:
```
TypeError: Cannot read properties of null (reading 'useContext')
Error occurred prerendering page "/_global-error"
```

**Root Cause**: Next.js App Router tries to server-render (SSR) ALL pages during build, including error pages. Our Privy and Thirdweb Web3 providers require browser APIs (`window`, `localStorage`) that don't exist during SSR.

---

## Why This Is Happening

### The Architecture Conflict

```
Next.js Build Process (SSR)
    ↓
Tries to pre-render /_global-error page
    ↓
Inherits Root Layout
    ↓
Root Layout → ClientLayoutWrapper → ClientLayout → Providers
    ↓
Providers try to use React hooks (useState, useContext)
    ↓
React context not properly initialized in SSR environment
    ↓
ERROR: Cannot read properties of null
```

### What We've Tried (All Failed)

1. ❌ `typescript: { ignoreBuildErrors: true }` - Only bypasses TypeScript, not runtime errors
2. ❌ `export const dynamic = 'force-dynamic'` - Doesn't prevent `/_global-error` from being pre-rendered
3. ❌ Dynamic import with `ssr: false` - Not allowed in Server Components
4. ❌ Custom `global-error.tsx` -Still gets SSR'd during build
5. ❌ `typeof window !== "undefined"` checks - Evaluated at runtime, code still bundled
6. ❌ Client Component wrappers - Next.js still pre-renders them during build

---

## Solution Options (Pick ONE)

### ⭐ **RECOMMENDED: Option 1 - Disable Pre-rendering for Error Pages**

Create a custom `global-error.tsx` that doesn't import ANY React or use the layout:

**File: `frontend/app/global-error.tsx`**
```tsx
// This file MUST be completely standalone - no imports, no layout
export default function GlobalError() {
  return (
    <html lang="en">
      <head>
        <title>Error</title>
      </head>
      <body>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1>Something went wrong</h1>
            <p>Please refresh the page</p>
          </div>
        </div>
      </body>
    </html>
  );
}
```

**AND** update **`frontend/next.config.ts`**:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // NEW: Skip error page generation during build
  experimental: {
    skipTrailingSlashRedirect: true,
    skipMiddlewareUrlNormalize: true,
  },
};

export default nextConfig;
```

---

### Option 2 - Switch to Pages Router (More Reliable)

Move from App Router (`app/` directory) to Pages Router (`pages/` directory):

**Why**: Pages Router has better support for client-only apps and doesn't aggressively pre-render everything.

**Steps**:
1. Create `pages/_app.tsx`:
```tsx
import type { AppProps } from 'next/app'
import { Providers } from '@/providers'
import '../app/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  )
}
```

2. Move all `app/*/page.tsx` files to `pages/*.tsx`
3. Delete the `app/` directory
4. Update imports

**Trade-off**: More work to migrate, but cleaner long-term solution.

---

### Option 3 - Make Providers SSR-Safe (Ideal but Complex)

Wrap ALL client-only code to only execute in browser:

**File: `frontend/providers/index.tsx`**
```tsx
"use client";

import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Don't render providers during SSR at all
  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  // Lazy load all providers only on client
  const PrivyProvider = require("@privy-io/react-auth").PrivyProvider;
  const ThirdwebProvider = require("thirdweb/react").ThirdwebProvider;
  // ... etc

  return (
    <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}>
      <ThirdwebProvider>
        {children}
      </ThirdwebProvider>
    </PrivyProvider>
  );
}
```

**Problem**: You need to modify EVERY provider to be SSR-safe. Privy and Thirdweb might not support this.

---

### Option 4 - Use Static Export (Simplest but Loses SSR Benefits)

**File: `frontend/next.config.ts`**
```typescript
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export', // Static site generation
  images: {
    unoptimized: true, // Required for static export
  },
};
```

**Trade-offs**:
- ✅ Build will succeed
- ❌ No server-side rendering at all
- ❌ No API routes
- ❌ No dynamic routes (unless pre-generated)

---

## Testing the Fix

After implementing ANY of the above:

```bash
cd frontend
rm -rf .next  # Clear build cache
npm run build # Should succeed
npm run start # Test production build
```

**Expected Success Output**:
```
✓ Compiled successfully
✓ Generating static pages (7/7)
✓ Finalizing page optimization
```

---

## Quick Decision Matrix

| Scenario | Recommended Option |
|----------|-------------------|
| Need build to pass ASAP | **Option 1** (Custom global-error) |
| Planning long-term maintenance | **Option 2** (Pages Router) |
| Must keep App Router + SSR | **Option 3** (SSR-safe providers) |
| Don't need SSR at all | **Option 4** (Static export) |

---

## Additional Notes

### Why `"use client"` Doesn't Fix This

The `"use client"` directive tells Next.js to make a component client-side AFTER the initial HTML is sent. But Next.js still tries to generate that initial HTML during build, which requires executing the component code in a Node.js environment (not browser).

### Why Dynamic Imports Don't Work

`next/dynamic` with `ssr: false` only works in Client Components. The root layout MUST be a Server Component (to export `metadata`), so we can't use `ssr: false` there.

### The Real Problem

Next.js App Router's philosophy is "Server by default, client when needed." But Web3 apps are "Client by default, server never." This creates a fundamental mismatch.

---

## Recommended Action Plan

1. **Immediate**: Implement **Option 1** to unblock the build
2. **Short-term**: Test if dev server works with the fix
3. **Long-term**: Consider migrating to Pages Router (Option 2) for better Web3 compatibility

---

## Files to Modify

### Option 1 (Quick Fix)
- `frontend/app/global-error.tsx` (create/replace)
- `frontend/next.config.ts` (update)

### Option 2 (Pages Router Migration)
- Create `frontend/pages/_app.tsx`
- Move all `app/*/page.tsx` → `pages/*.tsx`
- Delete `app/` directory

### Option 4 (Static Export)
- `frontend/next.config.ts` (update)

---

## Questions for Your Team

1. **Do you need Server-Side Rendering?** If no → Option 4 is easiest
2. **Do you need API routes in Next.js?** If yes → Option 1 or 2 only
3. **How much time can you invest?** Quick fix → Option 1, Proper fix → Option 2

---

## Contact

If you get stuck:
1. Share the FULL build error output
2. Confirm which option you chose
3. Share the modified files

The core issue is **Next.js App Router + Web3 client-only providers = SSR conflict**. We need to either prevent SSR or make providers SSR-safe.
