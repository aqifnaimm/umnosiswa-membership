"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Settings = {
  org_name: string;
  motto: string;
  registration_open: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  updated_at?: string | null;
};

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    org_name: "UMNOSiswa Malaysia",
    motto: "BERSATU • BERSETIA • BERKHIDMAT",
    registration_open: true,
    maintenance_mode: false,
    maintenance_message: "Sistem sedang diselenggara. Sila cuba sebentar lagi."
  });

  const [me, setMe] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function token() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function load() {
    setLoading(true);
    setMsg("");

    const t = await token();
    if (!t) {
      window.location.href = "/admin";
      return;
    }

    try {
      const r = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${t}` }
      });
      const d = await r.json();

      if (!r.ok) {
        setMsg(d.error || "Gagal mendapatkan tetapan sistem.");
        if (r.status === 401 || r.status === 403) {
          setTimeout(() => window.location.href = "/admin", 700);
        }
        return;
      }

      setSettings(d.settings);
      setMe(d.me);
    } catch {
      setMsg("Tidak dapat berhubung dengan server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (me?.role !== "super_admin") return;

    if (!settings.org_name.trim() || !settings.motto.trim()) {
      setMsg("Nama organisasi dan motto mesti diisi.");
      return;
    }

    if (
      settings.maintenance_mode &&
      !confirm("Aktifkan Maintenance Mode? Pengguna awam akan melihat notis penyelenggaraan apabila fungsi ini diintegrasikan ke laman awam.")
    ) return;

    setSaving(true);
    setMsg("");

    const t = await token();

    try {
      const r = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`
        },
        body: JSON.stringify(settings)
      });

      const d = await r.json();

      if (!r.ok) {
        setMsg(d.error || "Gagal menyimpan tetapan.");
        return;
      }

      setSettings(d.settings);
      setMsg("Tetapan sistem berjaya disimpan.");
    } catch {
      setMsg("Tidak dapat menyimpan tetapan sistem.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="system-settings-shell">
        <div className="system-settings-wrap">
          <div className="system-settings-loading">Memuatkan tetapan...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="system-settings-shell">
      <div className="system-settings-wrap">
        <header className="system-settings-header">
          <div>
            <span>UMNOSISWA MALAYSIA</span>
            <h1>System Settings</h1>
            <p>Kawal identiti organisasi dan status operasi portal dari satu tempat.</p>
          </div>
          <Link href="/admin">← Dashboard</Link>
        </header>

        {msg && <div className="system-settings-msg">{msg}</div>}

        <div className="system-settings-grid">
          <section className="system-settings-card">
            <div className="system-settings-card-head">
              <div>
                <span className="system-settings-kicker">IDENTITI</span>
                <h2>Maklumat Organisasi</h2>
              </div>
            </div>

            <label>
              Nama Organisasi
              <input
                value={settings.org_name}
                onChange={e => setSettings({ ...settings, org_name: e.target.value })}
                disabled={me?.role !== "super_admin"}
              />
            </label>

            <label>
              Motto
              <input
                value={settings.motto}
                onChange={e => setSettings({ ...settings, motto: e.target.value })}
                disabled={me?.role !== "super_admin"}
              />
            </label>
          </section>

          <section className="system-settings-card">
            <div className="system-settings-card-head">
              <div>
                <span className="system-settings-kicker">OPERASI</span>
                <h2>Status Sistem</h2>
              </div>
            </div>

            <div className="system-setting-toggle-row">
              <div>
                <strong>Pendaftaran Keahlian</strong>
                <small>Benarkan permohonan ahli baru dihantar.</small>
              </div>
              <button
                className={`system-toggle ${settings.registration_open ? "on" : "off"}`}
                onClick={() => me?.role === "super_admin" && setSettings({
                  ...settings,
                  registration_open: !settings.registration_open
                })}
                disabled={me?.role !== "super_admin"}
              >
                {settings.registration_open ? "OPEN" : "CLOSED"}
              </button>
            </div>

            <div className="system-setting-toggle-row danger">
              <div>
                <strong>Maintenance Mode</strong>
                <small>Digunakan ketika kemaskini atau penyelenggaraan sistem.</small>
              </div>
              <button
                className={`system-toggle ${settings.maintenance_mode ? "danger-on" : "off"}`}
                onClick={() => me?.role === "super_admin" && setSettings({
                  ...settings,
                  maintenance_mode: !settings.maintenance_mode
                })}
                disabled={me?.role !== "super_admin"}
              >
                {settings.maintenance_mode ? "ACTIVE" : "OFF"}
              </button>
            </div>

            <label>
              Mesej Maintenance
              <textarea
                rows={4}
                value={settings.maintenance_message}
                onChange={e => setSettings({ ...settings, maintenance_message: e.target.value })}
                disabled={me?.role !== "super_admin"}
              />
            </label>
          </section>

          <section className="system-settings-card system-settings-wide">
            <div className="system-settings-summary">
              <div>
                <span>Status Pendaftaran</span>
                <strong>{settings.registration_open ? "Dibuka" : "Ditutup"}</strong>
              </div>
              <div>
                <span>Maintenance</span>
                <strong>{settings.maintenance_mode ? "Aktif" : "Tidak Aktif"}</strong>
              </div>
              <div>
                <span>Akses Anda</span>
                <strong>{me?.role === "super_admin" ? "Super Admin" : "Read Only"}</strong>
              </div>
            </div>

            {me?.role === "super_admin" ? (
              <button className="system-settings-save" onClick={save} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Tetapan"}
              </button>
            ) : (
              <div className="system-settings-readonly">
                Hanya Super Admin boleh mengubah tetapan sistem.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
