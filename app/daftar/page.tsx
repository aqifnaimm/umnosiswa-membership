"use client";

import Link from "next/link";
import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

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
  { name: "UTM", zone: "Selatan" }
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
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

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


  function renderTurnstile() {
    if (!turnstileSiteKey || !turnstileRef.current || !window.turnstile || turnstileWidgetId.current) return;

    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: turnstileSiteKey,
      theme: "auto",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => {
        setTurnstileToken("");
        if (turnstileWidgetId.current) window.turnstile?.reset(turnstileWidgetId.current);
      },
      "error-callback": () => {
        setTurnstileToken("");
      }
    });
  }

  function resetTurnstile() {
    setTurnstileToken("");
    if (turnstileWidgetId.current) {
      window.turnstile?.reset(turnstileWidgetId.current);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!registrationOpen || maintenanceMode) {
      setError(maintenanceMode ? maintenanceMessage : "Pendaftaran keahlian sedang ditutup.");
      return;
    }

    if (!turnstileSiteKey) {
      setError("Turnstile belum dikonfigurasi. Sila cuba lagi sebentar lagi.");
      return;
    }

    if (!turnstileToken) {
      setError("Sila lengkapkan pengesahan keselamatan sebelum menghantar permohonan.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      ...Object.fromEntries(form.entries()),
      turnstile_token: turnstileToken
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Pendaftaran gagal.");
      setMessage("Permohonan berjaya dihantar. Status anda kini Dalam Semakan.");
      formElement.reset();
      setSelectedIpt("");
      resetTurnstile();
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
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderTurnstile}
      />

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
              <label>E-mel</label>
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
              <div className="privacy-consent-box">
                <label className="privacy-consent-row">
                  <input type="checkbox" name="privacy_consent" required />
                  <span>
                    Saya telah membaca dan memahami{" "}
                    <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                      Notis Privasi UMNOSiswa Malaysia
                    </Link>{" "}
                    dan bersetuju data peribadi saya diproses bagi tujuan pengurusan keahlian,
                    pengesahan ahli, pentadbiran organisasi, program dan komunikasi berkaitan
                    keahlian.
                  </span>
                </label>
                <small>
                  Anda mesti memberikan persetujuan sebelum menghantar permohonan.
                </small>
              </div>
            </div>

            <div className="field full">
              {turnstileSiteKey ? (
                <div ref={turnstileRef} style={{ minHeight: 65, marginBottom: 12 }} />
              ) : (
                <div className="status err" style={{ marginBottom: 12 }}>
                  Pengesahan keselamatan belum dikonfigurasi.
                </div>
              )}
              <button className="btn btn-primary" disabled={loading || !turnstileToken}>
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
