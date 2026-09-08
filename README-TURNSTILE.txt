UMNOSISWA MALAYSIA — TURNSTILE SETUP

This build adds Cloudflare Turnstile protection to the public registration form.

Vercel Environment Variables required:

NEXT_PUBLIC_TURNSTILE_SITE_KEY=YOUR_CLOUDFLARE_SITE_KEY
TURNSTILE_SECRET_KEY=YOUR_CLOUDFLARE_SECRET_KEY

NEXT_PUBLIC_TURNSTILE_SITE_KEY is public and is used by the registration page.
TURNSTILE_SECRET_KEY is private and must only exist as a server-side Vercel environment variable.

Recommended Vercel environments:
- Production
- Preview
- Development

After adding the variables, redeploy the project.

The registration page renders Turnstile and sends the token to /api/register.
The /api/register route validates the token with Cloudflare Siteverify before any
membership record is inserted into Supabase.
