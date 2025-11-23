# Environment Variables Setup

## Location

Create `.env.local` file in the `apps/web/` directory (NOT in the project root).

## Required Variables

```env
# Client-side API key (exposed to browser)
NEXT_PUBLIC_API_KEY=tuticorin-gov-app-2025

# Server-side secret (NEVER expose to browser)
API_SECRET=your-secret-key-here
```

## Important Notes

1. **File Location**: The `.env.local` file MUST be in `apps/web/` directory
2. **Restart Required**: After adding/changing environment variables, you MUST restart the Next.js dev server
3. **Variable Prefix**: Client-side variables MUST start with `NEXT_PUBLIC_` to be accessible in browser code
4. **Build Time**: `NEXT_PUBLIC_*` variables are embedded at build time, not runtime

## Troubleshooting

If `NEXT_PUBLIC_API_KEY` is undefined:

1. ✅ Check file location: `apps/web/.env.local` (not root)
2. ✅ Verify variable name: Must be exactly `NEXT_PUBLIC_API_KEY`
3. ✅ Restart dev server: Stop and restart `npm run dev` or `pnpm dev`
4. ✅ Check file format: No spaces around `=`, no quotes needed
5. ✅ Verify file exists: `ls -la apps/web/.env.local`

## Example .env.local

```env
NEXT_PUBLIC_API_KEY=tuticorin-gov-app-2025
API_SECRET=ij8ysQl8sOAZBNg2O49lF/7sD3v0l6XM4r3smTPkwKI=
MONGODB_URI=your-mongodb-connection-string
```

## Verification

To verify the variable is loaded, you can temporarily add this to a client component:

```typescript
console.log("API Key:", process.env.NEXT_PUBLIC_API_KEY);
```

Note: This will only work after restarting the dev server.
