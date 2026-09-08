"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let active = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setLoading(false);
      }
    });

    async function prepare() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMsg("Pautan tetapan semula tidak sah atau telah tamat tempoh. Sila minta pautan baharu.");
            setLoading(false);
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setReady(true);
          setLoading(false);
          return;
        }

        // For the implicit recovery flow, Supabase processes the access token
        // in the URL hash and emits PASSWORD_RECOVERY above. Give that flow a
        // moment before treating the link as invalid.
        setTimeout(async () => {
          if (!active) return;
          const { data: retry } = await supabase.auth.getSession();
          if (retry.session) {
            setReady(true);
          } else {
            setMsg("Pautan tetapan semula tidak sah atau telah tamat tempoh. Sila minta pautan baharu.");
          }
          setLoading(false);
        }, 700);
      } catch {
        if (active) {
          setMsg("Tidak dapat mengesahkan pautan tetapan semula.");
          setLoading(false);
        }
      }
    }

    prepare();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function updatePassword() {
    if (password.length < 8) {
      setMsg("Kata laluan baharu mesti sekurang-kurangnya 8 aksara.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Pengesahan kata laluan tidak sepadan.");
      return;
    }

    setSaving(true);
    setMsg("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMsg(error.message || "Gagal menetapkan kata laluan baharu.");
      setSaving(false);
      return;
    }

    await supabase.auth.signOut();
    setMsg("Kata laluan berjaya ditetapkan. Mengembalikan anda ke halaman log masuk...");
    setTimeout(() => router.replace("/admin"), 1200);
  }

  return (
    <main className="admin-login-shell">
      <div className="admin-login-overlay" />
      <section className="admin-login-content">
        <div className="admin-brand-wrap">
          <div className="admin-logo-frame">
            <Image src="/umnos-logo.jpeg" alt="UMNOSiswa Malaysia" width={300} height={180} priority />
          </div>
          <h1 className="admin-title">Tetapkan Kata Laluan Baharu</h1>
          <p className="admin-subtitle">Pemulihan akaun Pentadbir IPT</p>
          <div className="admin-title-line" />
        </div>

        <div className="admin-glass-card">
          <div className="admin-lock-icon">🔐</div>

          {loading ? (
            <p className="admin-reset-note">Mengesahkan pautan tetapan semula...</p>
          ) : ready ? (
            <>
              <label className="admin-field-label">Kata Laluan Baharu</label>
              <div className="admin-input-wrap">
                <input
                  className="admin-key-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 aksara"
                  autoComplete="new-password"
                />
              </div>

              <label className="admin-field-label" style={{ marginTop: 16 }}>Sahkan Kata Laluan</label>
              <div className="admin-input-wrap">
                <input
                  className="admin-key-input"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Masukkan semula kata laluan"
                  autoComplete="new-password"
                  onKeyDown={e => {
                    if (e.key === "Enter" && !saving) updatePassword();
                  }}
                />
              </div>

              <button className="admin-login-btn" disabled={saving || !password || !confirmPassword} onClick={updatePassword}>
                <span>{saving ? "Menyimpan..." : "Simpan Kata Laluan"}</span>
                <span>→</span>
              </button>
            </>
          ) : (
            <>
              <p className="admin-reset-note">{msg}</p>
              <button className="admin-login-btn" onClick={() => router.replace("/admin")}>
                <span>Kembali ke Log Masuk</span>
                <span>→</span>
              </button>
            </>
          )}

          {ready && msg && <div className="admin-error">{msg}</div>}

          <div className="admin-divider"><span/><small>UMNOSISWA</small><span/></div>
          <p className="admin-motto">BERSATU <b>•</b> BERSETIA <b>•</b> BERKHIDMAT</p>
        </div>
      </section>
    </main>
  );
}
