"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Member = {
  full_name: string;
  membership_id: string | null;
  ipt_name: string;
  graduation_month: number | null;
  graduation_year: number;
  student_status: "active_student" | "alumni";
  ipt_zone: string;
  umno_division: string;
  position_level: "nasional" | "ipt";
  member_position: string;
  status: "pending" | "approved" | "rejected";
};

const MONTHS = [
  "Januari","Februari","Mac","April","Mei","Jun",
  "Julai","Ogos","September","Oktober","November","Disember"
];

function graduationLabel(month: number | null, year: number) {
  if (!month || month < 1 || month > 12) return String(year);
  return `${MONTHS[month - 1]} ${year}`;
}

export default function MemberPortal() {
  const [memberId, setMemberId] = useState("");
  const [icLast4, setIcLast4] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState("");

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

  const qrUrl = member?.membership_id
    ? `/api/member/card-qr?membership_id=${encodeURIComponent(member.membership_id)}`
    : "";

  function roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  async function loadImage(src: string) {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Gagal memuatkan imej: ${src}`));
      img.src = src;
    });
  }

  function fitText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    startSize: number,
    minSize: number,
    weight = 800
  ) {
    let size = startSize;
    while (size > minSize) {
      ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    return size;
  }

  async function downloadCard() {
    if (!member?.membership_id || member.status !== "approved") return;

    setDownloading(true);
    setDownloadMsg("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Browser tidak menyokong penjanaan kad.");

      // Main navy/red background.
      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bg.addColorStop(0, "#071321");
      bg.addColorStop(0.62, "#101827");
      bg.addColorStop(1, "#701522");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decorative glow.
      const glow = ctx.createRadialGradient(1370, 110, 0, 1370, 110, 430);
      glow.addColorStop(0, "rgba(229,27,35,.36)");
      glow.addColorStop(1, "rgba(229,27,35,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(900, 0, 700, 650);

      // Subtle grid.
      ctx.strokeStyle = "rgba(255,255,255,.035)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= 1600; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1000);
        ctx.stroke();
      }
      for (let y = 0; y <= 1000; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1600, y);
        ctx.stroke();
      }

      // Watermark.
      ctx.save();
      ctx.globalAlpha = 0.035;
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 420px Arial, Helvetica, sans-serif";
      ctx.fillText("US", 1050, 930);
      ctx.restore();

      // Logo panel.
      roundedRect(ctx, 70, 68, 350, 150, 22);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      const logo = await loadImage("/umnos-logo.jpeg");
      const logoMaxW = 300;
      const logoMaxH = 120;
      const logoScale = Math.min(logoMaxW / logo.naturalWidth, logoMaxH / logo.naturalHeight);
      const logoW = logo.naturalWidth * logoScale;
      const logoH = logo.naturalHeight * logoScale;
      ctx.drawImage(
        logo,
        70 + (350 - logoW) / 2,
        68 + (150 - logoH) / 2,
        logoW,
        logoH
      );

      // Status chip.
      const statusText = member.student_status === "alumni" ? "ALUMNI" : "PELAJAR AKTIF";
      roundedRect(ctx, 1200, 82, 320, 78, 39);
      ctx.fillStyle = "rgba(38,201,117,.13)";
      ctx.fill();
      ctx.strokeStyle = "rgba(118,229,169,.30)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#76e5a9";
      ctx.font = "900 27px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(statusText, 1360, 121);

      // Main identity.
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#ef4650";
      ctx.font = "900 27px Arial, Helvetica, sans-serif";
      ctx.fillText("KAD KEAHLIAN DIGITAL", 78, 320);

      const name = member.full_name.toUpperCase();
      const nameSize = fitText(ctx, name, 980, 68, 38, 900);
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${nameSize}px Arial, Helvetica, sans-serif`;
      ctx.fillText(name, 78, 405);

      ctx.fillStyle = "rgba(255,255,255,.74)";
      ctx.font = "900 42px Arial, Helvetica, sans-serif";
      ctx.fillText(member.membership_id, 78, 468);

      // Information blocks.
      const info = [
        ["JAWATAN", member.member_position || "Ahli IPT"],
        ["PERINGKAT", member.position_level === "nasional" ? "Nasional" : "IPT"],
        ["IPT", member.ipt_name],
        ["STATUS", member.student_status === "alumni" ? "Alumni" : "Pelajar Aktif"],
        ["TAMAT PENGAJIAN", graduationLabel(member.graduation_month, member.graduation_year)],
        ["ZON IPT", member.ipt_zone]
      ];

      const startX = 78;
      const startY = 565;
      const colW = 310;
      const rowH = 145;

      info.forEach(([label, value], i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = startX + col * colW;
        const y = startY + row * rowH;

        ctx.fillStyle = "rgba(255,255,255,.38)";
        ctx.font = "700 20px Arial, Helvetica, sans-serif";
        ctx.fillText(label, x, y);

        const valueText = String(value || "—");
        const valueSize = fitText(ctx, valueText, colW - 35, 28, 20, 800);
        ctx.fillStyle = "#ffffff";
        ctx.font = `800 ${valueSize}px Arial, Helvetica, sans-serif`;
        ctx.fillText(valueText, x, y + 42);
      });

      // QR panel.
      roundedRect(ctx, 1190, 270, 330, 420, 28);
      ctx.fillStyle = "rgba(255,255,255,.055)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.10)";
      ctx.lineWidth = 2;
      ctx.stroke();

      roundedRect(ctx, 1240, 318, 230, 230, 18);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      const qr = await loadImage(qrUrl);
      ctx.drawImage(qr, 1252, 330, 206, 206);

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "900 22px Arial, Helvetica, sans-serif";
      ctx.fillText("IMBAS UNTUK PENGESAHAN", 1355, 602);
      ctx.fillStyle = "rgba(255,255,255,.52)";
      ctx.font = "700 18px Arial, Helvetica, sans-serif";
      ctx.fillText(member.membership_id, 1355, 636);

      // Footer.
      ctx.textAlign = "left";
      ctx.strokeStyle = "rgba(255,255,255,.09)";
      ctx.beginPath();
      ctx.moveTo(70, 865);
      ctx.lineTo(1530, 865);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,.52)";
      ctx.font = "700 21px Arial, Helvetica, sans-serif";
      ctx.fillText("BERSATU • BERSETIA • BERKHIDMAT", 78, 920);

      ctx.textAlign = "right";
      ctx.fillStyle = "#ef4650";
      ctx.font = "900 20px Arial, Helvetica, sans-serif";
      ctx.fillText(`PENGESAHAN: /verify/${member.membership_id}`, 1520, 920);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1)
      );

      if (!blob) throw new Error("Gagal menghasilkan fail PNG.");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Kad-Ahli-UMNOSiswa-${member.membership_id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDownloadMsg("Kad ahli berjaya dijana.");
    } catch (e: any) {
      setDownloadMsg(e?.message || "Gagal memuat turun kad ahli.");
    } finally {
      setDownloading(false);
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
          <h1>Log Masuk Ahli UMNOSiswa</h1>
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
                    <span className="active-chip">
                      {member.student_status === "alumni" ? "ALUMNI" : "PELAJAR AKTIF"}
                    </span>
                  </div>

                  <div className="digital-card-main-grid">
                    <div className="digital-card-body">
                      <small>KAD KEAHLIAN DIGITAL</small>
                      <h2>{member.full_name}</h2>
                      <div className="member-number">{member.membership_id}</div>
                      <div style={{
                        marginTop:10,
                        display:"inline-flex",
                        alignItems:"center",
                        gap:8,
                        flexWrap:"wrap"
                      }}>
                        <strong style={{
                          color:"#fff",
                          fontSize:14,
                          letterSpacing:".04em"
                        }}>
                          {member.member_position || "Ahli IPT"}
                        </strong>
                        <span style={{
                          padding:"4px 8px",
                          borderRadius:999,
                          border:"1px solid rgba(255,255,255,.18)",
                          color:"rgba(255,255,255,.68)",
                          fontSize:10,
                          fontWeight:800,
                          letterSpacing:".08em"
                        }}>
                          {member.position_level === "nasional" ? "NASIONAL" : "IPT"}
                        </span>
                      </div>
                      <div className="digital-details">
                        <div><span>IPT</span><strong>{member.ipt_name}</strong></div>
                        <div>
                          <span>STATUS</span>
                          <strong>{member.student_status === "alumni" ? "Alumni" : "Pelajar Aktif"}</strong>
                        </div>
                        <div>
                          <span>TAMAT PENGAJIAN</span>
                          <strong>{graduationLabel(member.graduation_month, member.graduation_year)}</strong>
                        </div>
                        <div><span>ZON IPT</span><strong>{member.ipt_zone}</strong></div>
                        <div><span>JAWATAN</span><strong>{member.member_position || "Ahli IPT"}</strong></div>
                        <div><span>PERINGKAT</span><strong>{member.position_level === "nasional" ? "Nasional" : "IPT"}</strong></div>
                        <div><span>BAHAGIAN UMNO</span><strong>{member.umno_division}</strong></div>
                      </div>
                    </div>

                    <div className="member-qr-area">
                      <div className="member-qr-box">
                        {qrUrl && <img src={qrUrl} alt={`QR verification ${member.membership_id}`} />}
                      </div>
                      <strong>IMBAS UNTUK PENGESAHAN</strong>
                      <small>{member.membership_id}</small>
                    </div>
                  </div>

                  <div className="digital-card-footer">
                    <span>BERSATU • BERSETIA • BERKHIDMAT</span>
                    <a href={`/verify/${member.membership_id}`}>PENGESAHAN →</a>
                  </div>
                </div>
                <p className="member-note">Imbas kod QR untuk pengesahan status keahlian rasmi.</p>
                <div className="member-card-actions">
                  <button
                    type="button"
                    className="member-download-card"
                    onClick={downloadCard}
                    disabled={downloading}
                  >
                    {downloading ? "Menjana kad..." : "↓ Muat Turun Kad Ahli PNG"}
                  </button>
                  <a className="member-verify-direct" href={`/verify/${member.membership_id}`}>
                    Buka Halaman Pengesahan →
                  </a>
                </div>
                {downloadMsg && <div className="member-download-msg">{downloadMsg}</div>}
              </>
            ):(
              <div className="member-status-card">
                <span className={`member-status-pill ${member.status}`}>{member.status==="pending" ? "Dalam Semakan" : member.status==="approved" ? "Diluluskan" : "Ditolak"}</span>
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
