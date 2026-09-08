UMNOSiswa Admin Design Update

Apa yang berubah:
- Login admin guna background navy-merah moden
- Glassmorphism login card
- Logo UMNOSiswa asal digunakan
- Responsive untuk desktop dan mobile
- Dashboard selepas login turut ditukar kepada gaya lebih kemas
- Fungsi API/admin approval sedia ada kekal sama

Cara pasang:

1. Replace:
   app/admin/page.tsx

2. Buka fail project:
   app/globals.css

3. Copy SEMUA kandungan daripada:
   ADMIN-STYLE-ADD-TO-GLOBALS.css

4. Paste di BAHAGIAN PALING BAWAH app/globals.css

5. Save.

6. GitHub Desktop:
   Summary: Redesign admin interface
   Commit to main
   Push origin

7. Tunggu Vercel auto deploy dan buka /admin

PENTING:
- Jangan delete CSS lama dalam globals.css.
- Hanya tambah CSS baru ini di bahagian bawah.
- API route /api/admin/applications tidak perlu diubah untuk update design ini.
