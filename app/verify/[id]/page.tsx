import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const MONTHS = [
  "Januari","Februari","Mac","April","Mei","Jun",
  "Julai","Ogos","September","Oktober","November","Disember"
];

function graduationLabel(month: number | null, year: number | null) {
  if (!year) return "—";
  if (!month || month < 1 || month > 12) return String(year);
  return `${MONTHS[month - 1]} ${year}`;
}

function studentStatus(month: number | null, year: number | null) {
  if (!year) return "active_student";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const graduationMonth = month && month >= 1 && month <= 12 ? month : 12;

  return (
    year < currentYear ||
    (year === currentYear && graduationMonth < currentMonth)
  )
    ? "alumni"
    : "active_student";
}

export default async function VerifyPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const membershipId = decodeURIComponent(id || "")
    .trim()
    .toUpperCase();

  let data: any = null;

  if (url && key && membershipId) {
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data: member, error } = await supabase
      .from("membership_applications")
      .select(
        "full_name,membership_id,ipt_name,ipt_zone,umno_division,status,graduation_month,graduation_year"
      )
      .eq("membership_id", membershipId)
      .maybeSingle();

    if (error) {
      console.error("Verify membership error:", error.message);
    } else {
      data = member;
    }
  }

  const valid = Boolean(
    data &&
    data.status === "approved" &&
    data.membership_id
  );

  const academicStatus = valid
    ? studentStatus(data.graduation_month, data.graduation_year)
    : null;

  return (
    <main className="verify-shell verify-official-shell">
      <section className={`verify-card verify-official-card ${valid ? "is-valid" : "is-invalid"}`}>
        <div className="verify-logo">
          <Image
            src="/umnos-logo.jpeg"
            alt="UMNOSiswa"
            width={260}
            height={140}
            priority
          />
        </div>

        {valid ? (
          <>
            <div className="verify-check">✓</div>
            <span className="verify-kicker">PENGESAHAN KEAHLIAN RASMI</span>
            <h1>KEAHLIAN SAH</h1>
            <p className="verify-subtitle">
              Rekod ini sepadan dengan pangkalan data keahlian UMNOSiswa Malaysia.
            </p>

            <div className="verify-member-name">{data.full_name}</div>
            <div className="verify-id">{data.membership_id}</div>

            <div className="verify-status-row">
              <span className="verify-valid-chip">✓ DISAHKAN</span>
              <span className={`verify-student-chip ${academicStatus}`}>
                {academicStatus === "alumni" ? "ALUMNI" : "ACTIVE STUDENT"}
              </span>
            </div>

            <dl className="verify-details">
              <div><dt>IPT</dt><dd>{data.ipt_name}</dd></div>
              <div><dt>Zon IPT</dt><dd>{data.ipt_zone}</dd></div>
              <div><dt>Bahagian UMNO</dt><dd>{data.umno_division}</dd></div>
              <div>
                <dt>Tamat Pengajian</dt>
                <dd>{graduationLabel(data.graduation_month, data.graduation_year)}</dd>
              </div>
              <div>
                <dt>Status Pelajar</dt>
                <dd>{academicStatus === "alumni" ? "Alumni" : "Active Student"}</dd>
              </div>
              <div><dt>Status Keahlian</dt><dd>Approved</dd></div>
            </dl>

            <div className="verify-security-note">
              Halaman ini tidak memaparkan nombor IC, nombor telefon atau alamat email ahli.
            </div>
          </>
        ) : (
          <>
            <div className="verify-x">×</div>
            <span className="verify-kicker">PENGESAHAN KEAHLIAN RASMI</span>
            <h1>KEAHLIAN TIDAK SAH</h1>
            <p className="verify-subtitle">
              ID <strong>{membershipId || "—"}</strong> tidak dapat disahkan sebagai
              rekod keahlian yang telah diluluskan.
            </p>
            <div className="verify-invalid-chip">TIDAK DISAHKAN</div>
          </>
        )}

        <div className="verify-actions">
          <Link href="/portal" className="verify-back">← Portal Ahli</Link>
          <Link href="/" className="verify-home">Laman Utama</Link>
        </div>

        <footer className="verify-footer">
          BERSATU • BERSETIA • BERKHIDMAT
        </footer>
      </section>
    </main>
  );
}
