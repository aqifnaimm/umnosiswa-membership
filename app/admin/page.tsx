"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

type Member = {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  ic_number: string;
  umno_member_no: string;
  ipt_name: string;
  graduation_month: number | null;
  graduation_year: number;
  ipt_zone: string;
  umno_division: string;
  status: "pending" | "approved" | "rejected";
  membership_id: string | null;
  created_at: string;
};

type AdminProfile = {
  email: string;
  role: "super_admin" | "admin";
  ipt_scope: string | null;
};

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  useEffect(() => {
    restoreSession();
  }, []);

  function renderLoginTurnstile() {
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

  function resetLoginTurnstile() {
    setTurnstileToken("");
    if (turnstileWidgetId.current) {
      window.turnstile?.reset(turnstileWidgetId.current);
    }
  }


  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function restoreSession() {
    setLoading(true);
    const token = await getAccessToken();

    if (!token) {
      setLoading(false);
      return;
    }

    await loadMembers(token);
  }

  async function login() {
    setMsg("");

    if (!turnstileSiteKey) {
      setMsg("Turnstile belum dikonfigurasi. Sila cuba lagi sebentar lagi.");
      return;
    }

    if (!turnstileToken) {
      setMsg("Sila lengkapkan pengesahan keselamatan sebelum log masuk.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          turnstile_token: turnstileToken
        })
      });

      resetLoginTurnstile();

      const result = await res.json();

      if (!res.ok || !result.email) {
        setMsg(result.error || "Nama pengguna atau kata laluan tidak sah.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.email,
        password
      });

      if (error || !data.session) {
        setMsg("Nama pengguna atau kata laluan tidak sah.");
        return;
      }

      setUsername("");
      setPassword("");
      await loadMembers(data.session.access_token);
    } catch {
      setMsg("Tidak dapat berhubung dengan server.");
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    const value = username.trim();

    if (!value) {
      setMsg("Masukkan nama pengguna pentadbir terlebih dahulu.");
      return;
    }

    setForgotLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value })
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Tidak dapat menghantar pautan tetapan semula kata laluan.");
        return;
      }

      setMsg(data.message || "Pautan tetapan semula kata laluan telah dihantar ke e-mel pentadbir.");
    } catch {
      setMsg("Tidak dapat berhubung dengan server.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function loadMembers(existingToken?: string) {
    setLoading(true);
    setMsg("");

    const token = existingToken || (await getAccessToken());

    if (!token) {
      setLoading(false);
      setProfile(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/applications", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          await supabase.auth.signOut();
          setProfile(null);
        }
        setMsg(data.error || "Gagal mendapatkan data.");
        return;
      }

      setMembers(data.members || []);
      setSelected([]);
      setProfile(data.admin);
    } catch {
      setMsg("Tidak dapat berhubung dengan server.");
    } finally {
      setLoading(false);
    }
  }

  async function change(id: string, status: "approved" | "rejected") {
    if (!confirm(status === "approved" ? "Luluskan permohonan ini?" : "Tolak permohonan ini?")) return;

    setLoading(true);
    setMsg("");

    const token = await getAccessToken();

    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, status })
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Gagal mengemaskini status.");
        return;
      }

      setMsg(
        status === "approved"
          ? `Permohonan diluluskan${data.member?.membership_id ? ` — ${data.member.membership_id}` : ""}.`
          : "Permohonan ditolak."
      );

      await loadMembers(token);
    } catch {
      setMsg("Tidak dapat mengemaskini permohonan.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelected(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleAllPending() {
    const pendingIds = shown.filter(m => m.status === "pending").map(m => m.id);
    const allSelected = pendingIds.length > 0 && pendingIds.every(id => selected.includes(id));

    if (allSelected) {
      setSelected(prev => prev.filter(id => !pendingIds.includes(id)));
    } else {
      setSelected(prev => Array.from(new Set([...prev, ...pendingIds])));
    }
  }

  async function bulkChange(status: "approved" | "rejected") {
    const ids = selected.filter(id => members.some(m => m.id === id && m.status === "pending"));

    if (!ids.length) {
      setMsg("Pilih sekurang-kurangnya satu permohonan dalam semakan.");
      return;
    }

    const label = status === "approved" ? "luluskan" : "tolak";
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${ids.length} permohonan yang dipilih?`)) return;

    setLoading(true);
    setMsg("");
    const token = await getAccessToken();

    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids, status })
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Gagal memproses permohonan secara pukal.");
        return;
      }

      setMsg(`${data.updated || ids.length} permohonan berjaya ${status === "approved" ? "diluluskan" : "ditolak"}.`);
      setSelected([]);
      await loadMembers(token);
    } catch {
      setMsg("Tidak dapat memproses permohonan secara pukal.");
    } finally {
      setLoading(false);
    }
  }

  async function changeOwnPassword() {
    if (newAdminPassword.length < 8) {
      setMsg("Kata laluan baharu mesti sekurang-kurangnya 8 aksara.");
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setMsg("Pengesahan kata laluan baharu tidak sepadan.");
      return;
    }

    setChangePasswordLoading(true);
    setMsg("");

    try {
      const token = await getAccessToken();
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword: newAdminPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Gagal menukar kata laluan.");
        return;
      }

      setCurrentPassword("");
      setNewAdminPassword("");
      setConfirmAdminPassword("");
      setShowChangePassword(false);
      setMsg("Kata laluan anda berjaya ditukar.");
    } catch {
      setMsg("Tidak dapat berhubung dengan server.");
    } finally {
      setChangePasswordLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
    setMembers([]);
    setUsername("");
    setPassword("");
    setMsg("");
  }

  const shown = useMemo(() => {
    const needle = q.toLowerCase();

    return members.filter((m) => {
      const haystack = [
        m.full_name, m.email, m.phone_number, m.umno_member_no,
        m.ipt_name, m.ipt_zone, m.umno_division, m.membership_id || ""
      ].join(" ").toLowerCase();

      return (filter === "all" || m.status === filter) && haystack.includes(needle);
    });
  }, [members, q, filter]);

  const mask = (x: string) => {
    const d = x.replace(/\D/g, "");
    return d.length >= 4 ? `******-**-${d.slice(-4)}` : "****";
  };

  const graduationLabel = (month: number | null, year: number) => {
    const months = [
      "Januari", "Februari", "Mac", "April", "Mei", "Jun",
      "Julai", "Ogos", "September", "Oktober", "November", "Disember"
    ];

    if (!month || month < 1 || month > 12) return `Tamat ${year}`;
    return `Tamat ${months[month - 1]} ${year}`;
  };

  if (!profile) {
    return (
      <main className="admin-login-shell">
        <div className="admin-login-overlay" />
        <section className="admin-login-content">
          <div className="admin-brand-wrap">
            <div className="admin-logo-frame">
              <Image src="/umnos-logo.jpeg" alt="UMNOSiswa Malaysia" width={300} height={180} priority />
            </div>
            <h1 className="admin-title">Papan Pemuka Pentadbir</h1>
            <p className="admin-subtitle">Log masuk menggunakan akaun pentadbir anda</p>
            <div className="admin-title-line" />
          </div>

          <div className="admin-glass-card">
            <div className="admin-lock-icon">🔒</div>

            <label className="admin-field-label">Nama Pengguna Pentadbir</label>
            <div className="admin-input-wrap">
              <input
                className="admin-key-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan nama pengguna"
                autoComplete="username"
              />
            </div>

            <label className="admin-field-label" style={{marginTop:16}}>Kata Laluan</label>
            <div className="admin-input-wrap">
              <input
                className="admin-key-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata laluan"
                onKeyDown={e => {
                  if (e.key === "Enter" && username && password && !loading) login();
                }}
              />
              <button type="button" className="admin-eye-btn" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <div ref={turnstileRef} style={{ marginTop: 18, display: "flex", justifyContent: "center", minHeight: 65 }} />
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
              strategy="afterInteractive"
              onLoad={renderLoginTurnstile}
            />

            <button className="admin-login-btn" disabled={!username || !password || !turnstileToken || loading || forgotLoading} onClick={login}>
              <span>{loading ? "Menyemak..." : "Log Masuk"}</span>
              <span>→</span>
            </button>

            <button
              type="button"
              className="admin-forgot-btn"
              disabled={!username || loading || forgotLoading}
              onClick={forgotPassword}
            >
              {forgotLoading ? "Menghantar pautan..." : "Lupa Kata Laluan?"}
            </button>

            {msg && <div className="admin-error">{msg}</div>}

            <div className="admin-divider"><span/><small>UMNOSISWA</small><span/></div>
            <p className="admin-motto">BERSATU <b>•</b> BERSETIA <b>•</b> BERKHIDMAT</p>
          </div>
        </section>
      </main>
    );
  }

  const pending = members.filter(m => m.status === "pending").length;
  const approved = members.filter(m => m.status === "approved").length;
  const rejected = members.filter(m => m.status === "rejected").length;
  const MONTHS = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogos","Sep","Okt","Nov","Dis"];
  const isAlumni = (m: Member) => {
    if (m.status !== "approved" || !m.graduation_year) return false;
    const now = new Date();
    const month = m.graduation_month || 12;
    return m.graduation_year < now.getFullYear() ||
      (m.graduation_year === now.getFullYear() && month < now.getMonth() + 1);
  };
  const activeStudents = members.filter(m => m.status === "approved" && !isAlumni(m)).length;
  const alumni = members.filter(isAlumni).length;
  const registrationTrend = Array(12).fill(0);
  members.forEach(m => {
    const d = new Date(m.created_at);
    if (!Number.isNaN(d.getTime())) registrationTrend[d.getMonth()]++;
  });
  const maxRegistration = Math.max(...registrationTrend, 1);
  const totalMembers = approved;

  return (
    <main className="admin-dashboard-shell">
      <header className="admin-dash-header">
        <div>
          <span className="admin-dash-kicker">UMNOSISWA MALAYSIA</span>
          <h1>Papan Pemuka Pentadbir</h1>
          <p style={{margin:"8px 0 0",opacity:.65,fontSize:13}}>
            {profile.email} · {profile.role === "super_admin" ? "Pentadbir Utama" : "Admin"}
          </p>
        </div>
        <button className="admin-logout-btn" onClick={logout}>Log Keluar</button>
      </header>

      <section className="admin-dashboard-body">
        <div className="admin-account-card">
          <div>
            <span className="admin-dash-kicker">AKAUN PENTADBIR</span>
            <h2>Tetapan Keselamatan</h2>
            <p>Tukar kata laluan akaun anda pada bila-bila masa.</p>
          </div>
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => { setShowChangePassword(v => !v); setMsg(""); }}
          >
            {showChangePassword ? "Tutup" : "Tukar Kata Laluan"}
          </button>
        </div>

        {showChangePassword && (
          <div className="admin-password-card">
            <h3>Tukar Kata Laluan</h3>
            <p className="admin-password-help">Masukkan kata laluan semasa dan kata laluan baharu anda.</p>
            <div className="admin-password-grid">
              <div>
                <label>Kata Laluan Semasa</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" placeholder="Kata laluan semasa" />
              </div>
              <div>
                <label>Kata Laluan Baharu</label>
                <input type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} autoComplete="new-password" placeholder="Minimum 8 aksara" />
              </div>
              <div>
                <label>Sahkan Kata Laluan Baharu</label>
                <input type="password" value={confirmAdminPassword} onChange={e => setConfirmAdminPassword(e.target.value)} autoComplete="new-password" placeholder="Ulang kata laluan baharu" />
              </div>
            </div>
            <button
              type="button"
              className="admin-login-btn admin-password-submit"
              disabled={!currentPassword || !newAdminPassword || !confirmAdminPassword || changePasswordLoading}
              onClick={changeOwnPassword}
            >
              {changePasswordLoading ? "Menukar..." : "Simpan Kata Laluan Baharu"}
            </button>
          </div>
        )}

        {profile.role === "admin" && profile.ipt_scope && (
          <section className="ipt-dashboard-section">
            <div className="ipt-dashboard-heading">
              <div>
                <span className="admin-dash-kicker">DASHBOARD IPT</span>
                <h2>{profile.ipt_scope}</h2>
                <p>Ringkasan keahlian dan permohonan untuk IPT anda sahaja.</p>
              </div>
              <Link href="/admin/analytics" className="admin-refresh-btn" style={{textDecoration:"none",display:"inline-flex",alignItems:"center"}}>
                Analitik Penuh ↗
              </Link>
            </div>

            <div className="ipt-kpi-grid">
              <div className="ipt-kpi-card"><span>Total Members</span><strong>{totalMembers}</strong><small>Keahlian diluluskan</small></div>
              <div className="ipt-kpi-card"><span>Active Students</span><strong>{activeStudents}</strong><small>Pelajar aktif</small></div>
              <div className="ipt-kpi-card"><span>Alumni</span><strong>{alumni}</strong><small>Bekas pelajar</small></div>
              <div className="ipt-kpi-card"><span>Pending Applications</span><strong>{pending}</strong><small>Menunggu semakan</small></div>
              <div className="ipt-kpi-card"><span>Rejected</span><strong>{rejected}</strong><small>Permohonan ditolak</small></div>
            </div>

            <div className="ipt-dashboard-grid">
              <article className="ipt-chart-card ipt-chart-wide">
                <div className="ipt-card-head"><div><span>REGISTRATION TREND</span><h3>Pendaftaran Mengikut Bulan</h3></div></div>
                <div className="ipt-month-chart">
                  {registrationTrend.map((value, i) => (
                    <div className="ipt-month-column" key={MONTHS[i]}>
                      <strong>{value}</strong>
                      <div className="ipt-month-track"><div style={{height:`${value ? Math.max((value/maxRegistration)*100,5) : 0}%`}} /></div>
                      <small>{MONTHS[i]}</small>
                    </div>
                  ))}
                </div>
              </article>

              <article className="ipt-chart-card">
                <div className="ipt-card-head"><div><span>STUDENT STATUS</span><h3>Active vs Alumni</h3></div></div>
                <div className="ipt-status-grid">
                  <div><strong>{activeStudents}</strong><span>Active Students</span></div>
                  <div><strong>{alumni}</strong><span>Alumni</span></div>
                </div>
                <div className="ipt-split-track"><div style={{width:`${approved ? (activeStudents/approved)*100 : 0}%`}} /></div>
              </article>

              <article className="ipt-chart-card">
                <div className="ipt-card-head"><div><span>APPLICATION STATUS</span><h3>Status Permohonan</h3></div></div>
                <div className="ipt-status-list">
                  <div><span><i className="ipt-dot approved" /> Diluluskan</span><strong>{approved}</strong></div>
                  <div><span><i className="ipt-dot pending" /> Dalam Semakan</span><strong>{pending}</strong></div>
                  <div><span><i className="ipt-dot rejected" /> Ditolak</span><strong>{rejected}</strong></div>
                </div>
              </article>
            </div>
          </section>
        )}

        <div className="admin-stat-grid">
          <div className="admin-stat-card"><span>Jumlah Permohonan</span><strong>{members.length}</strong></div>
          <div className="admin-stat-card"><span>Dalam Semakan</span><strong>{pending}</strong></div>
          <div className="admin-stat-card"><span>Diluluskan</span><strong>{approved}</strong></div>
          <div className="admin-stat-card"><span>Ditolak</span><strong>{rejected}</strong></div>
        </div>

        <div className="admin-data-card">
          <div className="admin-data-head">
            <div>
              <span className="admin-dash-kicker">PENGURUSAN AHLI</span>
              <h2>Permohonan Keahlian</h2>
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <Link
                href="/admin/members"
                className="admin-refresh-btn"
                style={{textDecoration:"none",display:"inline-flex",alignItems:"center"}}
              >
                Pengurusan Data Ahli →
              </Link>
              <Link
                href="/admin/analytics"
                className="admin-refresh-btn"
                style={{textDecoration:"none",display:"inline-flex",alignItems:"center"}}
              >
                Analitik ↗
              </Link>
              {profile.role === "super_admin" && (
                <Link
                  href="/admin/settings"
                  className="admin-refresh-btn"
                  style={{textDecoration:"none",display:"inline-flex",alignItems:"center"}}
                >
                  Tetapan Sistem ⚙
                </Link>
              )}
              <button className="admin-refresh-btn" onClick={() => loadMembers()} disabled={loading}>Muat Semula</button>
            </div>
          </div>

          <div className="admin-toolbar">
            <input placeholder="Cari nama, IPT, no. ahli UMNO, bahagian..." value={q} onChange={e => setQ(e.target.value)} />
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">Semua Status</option>
              <option value="pending">Dalam Semakan</option>
              <option value="approved">Diluluskan</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",margin:"12px 0"}}>
            <button className="admin-refresh-btn" onClick={toggleAllPending} disabled={loading}>
              Pilih Semua Dalam Semakan
            </button>
            <button className="admin-approve-btn" onClick={() => bulkChange("approved")} disabled={loading || selected.length === 0}>
              Luluskan Pilihan ({selected.length})
            </button>
            <button className="admin-reject-btn" onClick={() => bulkChange("rejected")} disabled={loading || selected.length === 0}>
              Tolak Pilihan ({selected.length})
            </button>
            {selected.length > 0 && <small>{selected.length} dipilih</small>}
          </div>

          {msg && <div className="admin-success">{msg}</div>}

          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pilih</th><th>Nama</th><th>IC</th><th>No. Ahli UMNO</th><th>IPT</th><th>Zon</th>
                  <th>Bahagian</th><th>Status</th><th>ID</th><th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(m => (
                  <tr key={m.id}>
                    <td>
                      {m.status === "pending" ? (
                        <input
                          type="checkbox"
                          checked={selected.includes(m.id)}
                          onChange={() => toggleSelected(m.id)}
                          aria-label={`Pilih ${m.full_name}`}
                        />
                      ) : "—"}
                    </td>
                    <td><strong>{m.full_name}</strong><small>{m.email}</small></td>
                    <td>{mask(m.ic_number)}</td>
                    <td>{m.umno_member_no}</td>
                    <td>{m.ipt_name}<small>{graduationLabel(m.graduation_month, m.graduation_year)}</small></td>
                    <td>{m.ipt_zone}</td>
                    <td>{m.umno_division}</td>
                    <td><span className={`admin-status ${m.status}`}>{m.status==="pending" ? "Dalam Semakan" : m.status==="approved" ? "Diluluskan" : "Ditolak"}</span></td>
                    <td>{m.membership_id || "—"}</td>
                    <td>
                      {m.status === "pending" ? (
                        <div className="admin-action-row">
                          <button className="admin-approve-btn" onClick={() => change(m.id,"approved")}>Luluskan</button>
                          <button className="admin-reject-btn" onClick={() => change(m.id,"rejected")}>Tolak</button>
                        </div>
                      ) : <span className="admin-done">Selesai</span>}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={10} className="admin-empty">Tiada rekod ditemui.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
