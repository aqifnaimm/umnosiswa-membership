"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Member = {
  full_name: string;
  membership_id: string | null;
  ipt_name: string;
  ipt_zone: string;
  umno_division: string;
  status: "pending" | "approved" | "rejected";
};

export default function MemberPortal() {
  const [umnoNo, setUmnoNo] = useState("");
  const [icLast4, setIcLast4] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function check() {
    setLoading(true);
    setMsg("");
    setMember(null);

    try {
      const r = await fetch("/api/member/lookup", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ umno_member_no: umnoNo, ic_last4: icLast4 })
      });
      const d = await r.json();
      if (!r.ok) {
        setMsg(d.error || "Rekod tidak ditemui.");
        return;
      }
      setMember(d.member);
    } catch {
      setMsg("Tidak dapat berhubung dengan server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="member-portal-shell">
      <div className="member-portal-bg" />
      <section className="member-portal-container">
        <Link href="/" className="member-back">← Kembali ke laman utama</Link>

        <div className="member-portal-head">
          <div className="member-logo-box">
            <Image src="/umnos-logo.jpeg" alt="UMNOSiswa" width={280} height={150} priority />
          </div>
          <span>PORTAL AHLI</span>
          <h1>Semakan Keahlian UMNOSiswa</h1>
          <p>Semak status permohonan dan kad keahlian digital anda.</p>
        </div>

        {!member && (
          <div className="member-lookup-card">
            <label>No. Ahli UMNO</label>
            <input value={umnoNo} onChange={e=>setUmnoNo(e.target.value)} placeholder="Masukkan No. Ahli UMNO" />
            <label>4 digit terakhir No. IC</label>
            <input value={icLast4} onChange={e=>setIcLast4(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Contoh: 1234" inputMode="numeric" maxLength={4} />
            <button disabled={loading || !umnoNo || icLast4.length !== 4} onClick={check}>
              {loading ? "Menyemak..." : "Semak Keahlian →"}
            </button>
            {msg && <div className="member-error">{msg}</div>}
          </div>
        )}

        {member && (
          <div className="member-result">
            {member.status === "approved" && member.membership_id ? (
              <>
                <div className="digital-card">
                  <div className="digital-card-top">
                    <div className="digital-logo">
                      <Image src="/umnos-logo.jpeg" alt="UMNOSiswa" width={230} height={120} />
                    </div>
                    <span className="active-chip">ACTIVE</span>
                  </div>

                  <div className="digital-card-body">
                    <small>KAD KEAHLIAN DIGITAL</small>
                    <h2>{member.full_name}</h2>
                    <div className="member-number">{member.membership_id}</div>

                    <div className="digital-details">
                      <div><span>IPT</span><strong>{member.ipt_name}</strong></div>
                      <div><span>ZON IPT</span><strong>{member.ipt_zone}</strong></div>
                      <div><span>BAHAGIAN UMNO</span><strong>{member.umno_division}</strong></div>
                    </div>
                  </div>

                  <div className="digital-card-footer">
                    <span>BERSATU • BERSETIA • BERKHIDMAT</span>
                    <a href={`/verify/${member.membership_id}`}>VERIFY →</a>
                  </div>
                </div>

                <p className="member-note">
                  Status keahlian anda aktif. Gunakan nombor ahli UMNOSiswa di atas untuk rujukan.
                </p>
              </>
            ) : (
              <div className="member-status-card">
                <span className={`member-status-pill ${member.status}`}>{member.status}</span>
                <h2>{member.full_name}</h2>
                <p>
                  {member.status === "pending"
                    ? "Permohonan anda masih dalam semakan pentadbir."
                    : "Permohonan anda tidak diluluskan. Sila hubungi pentadbir jika memerlukan semakan lanjut."}
                </p>
              </div>
            )}

            <button className="member-reset" onClick={()=>{setMember(null);setMsg("");}}>
              Buat Semakan Lain
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
