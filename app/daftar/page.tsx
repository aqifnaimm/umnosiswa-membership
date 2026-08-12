"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const zones = ["Utara", "Lembah Klang", "Selatan", "Pantai Timur", "Sabah", "Sarawak"];
const months = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember"
];

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    } catch (err: any) {
      setError(err.message || "Pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
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
              <input name="ipt_name" required placeholder="Contoh: IIUM / UIAM" />
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
              <select name="ipt_zone" required defaultValue="">
                <option value="" disabled>Pilih zon</option>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
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
