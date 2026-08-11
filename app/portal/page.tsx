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
  const [memberId, setMemberId] = useState("");
  const [icLast4, setIcLast4] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function check() {
    setLoading(true); setMsg(""); setMember(null);
    try {
      const r = await fetch("/api/member/lookup", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({membership_id:memberId.trim().toUpperCase(),ic_last4:icLast4})
      });
      const d=await r.json();
      if(!r.ok){setMsg(d.error||"Rekod tidak ditemui.");return}
      setMember(d.member);
    } catch { setMsg("Tidak dapat berhubung dengan server."); }
    finally { setLoading(false); }
  }

  const verifyUrl =
    typeof window !== "undefined" && member?.membership_id
      ? `${window.location.origin}/verify/${member.membership_id}`
      : "";

  const qrUrl = verifyUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(verifyUrl)}`
    : "";

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
          <h1>Login Ahli UMNOSiswa</h1>
          <p>Masukkan ID UMNOSiswa dan 4 digit terakhir nombor IC anda.</p>
        </div>

        {!member && (
          <div className="member-lookup-card">
            <label>ID UMNOSiswa</label>
            <input value={memberId} onChange={e=>setMemberId(e.target.value.toUpperCase().replace(/\s/g,""))} placeholder="Contoh: US000001" maxLength={8}/>
            <label>4 digit terakhir No. IC</label>
            <input value={icLast4} onChange={e=>setIcLast4(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Contoh: 1234" inputMode="numeric" maxLength={4}/>
            <button disabled={loading||!memberId||icLast4.length!==4} onClick={check}>
              {loading?"Menyemak...":"Log Masuk →"}
            </button>
            {msg&&<div className="member-error">{msg}</div>}
          </div>
        )}

        {member && (
          <div className="member-result">
            {member.status==="approved" && member.membership_id ? (
              <>
                <div className="digital-card digital-card-with-qr">
                  <div className="digital-card-top">
                    <div className="digital-logo">
                      <Image src="/umnos-logo.jpeg" alt="UMNOSiswa" width={230} height={120}/>
                    </div>
                    <span className="active-chip">ACTIVE</span>
                  </div>

                  <div className="digital-card-main-grid">
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

                    <div className="member-qr-area">
                      <div className="member-qr-box">
                        {qrUrl && <img src={qrUrl} alt={`QR verification ${member.membership_id}`} />}
                      </div>
                      <strong>SCAN TO VERIFY</strong>
                      <small>{member.membership_id}</small>
                    </div>
                  </div>

                  <div className="digital-card-footer">
                    <span>BERSATU • BERSETIA • BERKHIDMAT</span>
                    <a href={`/verify/${member.membership_id}`}>VERIFY →</a>
                  </div>
                </div>
                <p className="member-note">Scan QR untuk pengesahan status keahlian.</p>
              </>
            ):(
              <div className="member-status-card">
                <span className={`member-status-pill ${member.status}`}>{member.status}</span>
                <h2>{member.full_name}</h2>
                <p>{member.status==="pending"?"Permohonan anda masih dalam semakan pentadbir.":"Permohonan anda tidak diluluskan. Sila hubungi pentadbir."}</p>
              </div>
            )}
            <button className="member-reset" onClick={()=>{setMember(null);setMsg("");setMemberId("");setIcLast4("");}}>Log Keluar</button>
          </div>
        )}
      </section>
    </main>
  );
}
