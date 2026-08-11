# UMNOSiswa Membership Portal

Starter project untuk `umnosiswa.my`.

## Fungsi yang sudah disediakan

- Homepage rasmi
- Borang pendaftaran ahli
- Field:
  - Nama penuh
  - Nombor telefon
  - Email
  - Nombor IC
  - Nombor ahli UMNO
  - IPT
  - Tahun tamat belajar
  - Zon IPT
  - Bahagian UMNO
- API pendaftaran ke Supabase
- Login magic-link Supabase
- Starter dashboard ahli
- Starter admin dashboard
- SQL schema untuk database
- Auto membership ID apabila status ditukar kepada `approved`
  - Format: `UMS-2026-00001`

## 1. Jalankan di komputer

Install Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`.

## 2. Setup Supabase

1. Buat project Supabase.
2. Pergi ke SQL Editor.
3. Copy semua kandungan `supabase/schema.sql`.
4. Run.
5. Ambil:
   - Project URL
   - anon public key
   - service_role key
6. Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Penting:** `SUPABASE_SERVICE_ROLE_KEY` mesti server-only dan jangan commit ke GitHub.

## 3. Deploy ke Vercel

1. Upload project ke GitHub.
2. Import repository dalam Vercel.
3. Tambah environment variables yang sama.
4. Deploy.
5. Dalam Vercel > Project > Settings > Domains, tambah:
   - `umnosiswa.my`
   - `www.umnosiswa.my`

Vercel akan tunjuk DNS records yang perlu dimasukkan.

## 4. Exabytes DNS

Dalam Exabytes, buka pengurusan DNS untuk `umnosiswa.my`.

Gunakan records yang Vercel paparkan. Biasanya Vercel akan minta root domain dan `www`
diarahkan ke mereka, tetapi ikut nilai yang dipaparkan dalam akaun Vercel anda semasa setup.

Jangan tukar nameserver secara rawak kalau email domain atau servis lain sedang digunakan.

## 5. Sebelum launch production

Starter ini belum patut dianggap production-ready untuk data IC.

Buat perkara berikut dahulu:

- Admin authentication + admin role
- Audit log untuk approve/reject
- Mask nombor IC pada paparan admin biasa
- Encryption / secure handling untuk nombor IC
- Rate limiting / anti-bot
- Captcha jika perlu
- Notis privasi organisasi
- Polisi retention dan deletion data
- Backup database
- Validation lebih ketat
- Senarai IPT dan Bahagian UMNO sebagai searchable dropdown
- Email pengesahan keputusan permohonan
- Digital membership card + QR code
- Export Excel admin
- Pengasingan access level admin
