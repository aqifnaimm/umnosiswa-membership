"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const ipts = [
  { name: "UM", zone: "Lembah Klang" },
  { name: "UKM", zone: "Lembah Klang" },
  { name: "UMPSA", zone: "Pantai Timur" },
  { name: "UMK", zone: "Pantai Timur" },
  { name: "UNIMAP", zone: "Utara" },
  { name: "UNISZA", zone: "Pantai Timur" },
  { name: "USIM", zone: "Lembah Klang" },
  { name: "UNIKL", zone: "Lembah Klang" },
  { name: "UITM", zone: "Lembah Klang" },
  { name: "UTHM", zone: "Selatan" },
  { name: "UPSI", zone: "Lembah Klang" },
  { name: "USM", zone: "Utara" },
  { name: "UPM", zone: "Lembah Klang" },
  { name: "UUM", zone: "Utara" },
  { name: "UTEM", zone: "Selatan" },
  { name: "UMT", zone: "Pantai Timur" },
  { name: "UMS", zone: "Sabah" },
  { name: "UIAM", zone: "Lembah Klang" }
].sort((a, b) => a.name.localeCompare(b.name));

const months = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember"
];

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("Sistem sedang diselenggara. Sila cuba sebentar lagi.");
  const [selectedIpt, setSelectedIpt] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        setRegistrationOpen(d.registration_open !== false);
        setMaintenanceMode(d.maintenance_mode === true);
        if (d.maintenance_message) setMaintenanceMessage(d.maintenance_message);
      })
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!registrationOpen || maintenanceMode) {
      setError(maintenanceMode ? maintenanceMessage : "Pendaftaran keahlian sedang ditutup.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Pendaftaran gagal.");
      setMessage("Permohonan berjaya dihantar. Status anda kini Pending.");
      e.currentTarget.reset();
      setSelectedIpt("");
    } catch (err: any) {
      setError(err.message || "Pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
  }

  if (settingsLoading) {
    return <div className="public-status-page"><div className="public-status-card">Memuatkan...</div></div>;
  }

  if (maintenanceMode) {
    return (
      <div className="public-status-page">
        <div className="public-status-card">
          <span>UMNOSISWA MALAYSIA</span>
          <h1>Sistem Dalam Penyelenggaraan</h1>
          <p>{maintenanceMessage}</p>
          <Link className="btn btn-outline" href="/">Kembali ke Homepage</Link>
        </div>
      </div>
    );
  }

  if (!registrationOpen) {
    return (
      <div className="public-status-page">
        <div className="public-status-card">
          <span>PENDAFTARAN KEAHLIAN</span>
          <h1>Pendaftaran Ditutup</h1>
          <p>Pendaftaran ahli baharu ditutup sementara oleh pentadbir sistem.</p>
          <Link className="btn btn-outline" href="/">Kembali ke Homepage</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand">UMNOSiswa Malaysia</Link>
          <Link className="btn btn-outline" href="/">Kembali</Link>
        </div>
      </nav>

      <div className="form-wrap">
        <div style={{marginBottom:22}}>
          <span className="eyebrow">Pendaftaran Ahli</span>
          <h2 style={{marginTop:10}}>Daftar Keahlian UMNOSiswa</h2>
          <p className="small">Sila pastikan maklumat yang diberikan adalah tepat.</p>
        </div>

        <form className="form-card" onSubmit={submit}>
          <div className="form-grid">
            <div className="field full">
              <label>Nama Penuh</label>
              <input name="full_name" required />
            </div>

            <div className="field">
              <label>Nombor Telefon</label>
              <input name="phone_number" type="tel" required placeholder="01X-XXXXXXX" />
            </div>

            <div className="field">
              <label>Email</label>
              <input name="email" type="email" required />
            </div>

            <div className="field">
              <label>Nombor Kad Pengenalan</label>
              <input name="ic_number" required placeholder="XXXXXX-XX-XXXX" />
            </div>

            <div className="field">
              <label>Nombor Ahli UMNO</label>
              <input name="umno_member_no" required />
            </div>

            <div className="field full">
              <label>Institusi Pengajian Tinggi (IPT)</label>
              <select
                name="ipt_name"
                required
                value={selectedIpt}
                onChange={e => setSelectedIpt(e.target.value)}
              >
                <option value="" disabled>Pilih IPT</option>
                {ipts.map(ipt => (
                  <option key={ipt.name} value={ipt.name}>{ipt.name}</option>
                ))}
              </select>
            </div>

            <div className="field full">
              <label>Kampus</label>
              <input
                name="campus"
                required
                placeholder="Contoh: Kampus Gombak / Kampus Bangi / Kampus Pagoh"
              />
            </div>

            <div className="field">
              <label>Bulan Tamat Pengajian</label>
              <select name="graduation_month" required defaultValue="">
                <option value="" disabled>Pilih bulan</option>
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Tahun Tamat Pengajian</label>
              <input name="graduation_year" type="number" min="2020" max="2040" required />
            </div>

            <div className="field">
              <label>Zon IPT</label>
              <input
                value={ipts.find(ipt => ipt.name === selectedIpt)?.zone || ""}
                placeholder="Auto ikut IPT"
                readOnly
              />
              <input
                type="hidden"
                name="ipt_zone"
                value={ipts.find(ipt => ipt.name === selectedIpt)?.zone || ""}
              />
            </div>

            <div className="field full">
              <label>Bahagian UMNO</label>
              <input name="umno_division" required placeholder="Contoh: Gombak" />
            </div>

            <div className="field full">
              <div className="notice">
                Dengan menghantar borang ini, anda mengesahkan bahawa maklumat yang diberikan
                adalah benar dan bersetuju data digunakan bagi tujuan pengurusan keahlian UMNOSiswa.
                Sediakan notis privasi rasmi organisasi sebelum pelancaran awam.
              </div>
            </div>

            <div className="field full">
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Menghantar..." : "Hantar Permohonan"}
              </button>
            </div>
          </div>

          {message && <div className="status ok">{message}</div>}
          {error && <div className="status err">{error}</div>}
        </form>
      </div>
    </>
  );
}
