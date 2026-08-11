import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data } = await supabase
    .from("membership_applications")
    .select("full_name,membership_id,ipt_name,ipt_zone,umno_division,status")
    .eq("membership_id", params.id)
    .eq("status", "approved")
    .maybeSingle();

  return (
    <main className="verify-shell">
      <section className="verify-card">
        <div className="verify-logo">
          <Image src="/umnos-logo.jpeg" alt="UMNOSiswa" width={260} height={140} priority />
        </div>
        {data ? (
          <>
            <div className="verify-check">✓</div>
            <span className="verify-kicker">KEAHLIAN DISAHKAN</span>
            <h1>{data.full_name}</h1>
            <div className="verify-id">{data.membership_id}</div>
            <dl>
              <div><dt>IPT</dt><dd>{data.ipt_name}</dd></div>
              <div><dt>Zon IPT</dt><dd>{data.ipt_zone}</dd></div>
              <div><dt>Bahagian UMNO</dt><dd>{data.umno_division}</dd></div>
            </dl>
            <div className="verify-active">ACTIVE MEMBER</div>
          </>
        ) : (
          <>
            <div className="verify-x">×</div>
            <span className="verify-kicker">TIDAK DISAHKAN</span>
            <h1>Rekod tidak ditemui</h1>
            <p>Nombor keahlian ini tidak dapat disahkan sebagai ahli aktif.</p>
          </>
        )}
        <Link href="/portal" className="verify-back">← Portal Ahli</Link>
      </section>
    </main>
  );
}
