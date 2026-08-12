"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
};

type AdminProfile = {
  email: string;
  role: "super_admin" | "admin";
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

  useEffect(() => {
    restoreSession();
  }, []);

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
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const result = await res.json();

      if (!res.ok || !result.email) {
        setMsg(result.error || "Username atau kata laluan tidak sah.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.email,
        password
      });

      if (error || !data.session) {
        setMsg("Username atau kata laluan tidak sah.");
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
      setMsg("Pilih sekurang-kurangnya satu permohonan pending.");
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
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Login menggunakan akaun pentadbir anda</p>
            <div className="admin-title-line" />
          </div>

          <div className="admin-glass-card">
            <div className="admin-lock-icon">🔒</div>

            <label className="admin-field-label">Username Admin</label>
            <div className="admin-input-wrap">
              <input
                className="admin-key-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
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
                  if (e.key === "Enter" && email && password && !loading) login();
                }}
              />
              <button type="button" className="admin-eye-btn" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <button className="admin-login-btn" disabled={!email || !password || loading} onClick={login}>
              <span>{loading ? "Menyemak..." : "Log Masuk"}</span>
              <span>→</span>
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

  return (
    <main className="admin-dashboard-shell">
      <header className="admin-dash-header">
        <div>
          <span className="admin-dash-kicker">UMNOSISWA MALAYSIA</span>
          <h1>Dashboard Pentadbir</h1>
          <p style={{margin:"8px 0 0",opacity:.65,fontSize:13}}>
            {profile.email} · {profile.role === "super_admin" ? "Super Admin" : "Admin"}
          </p>
        </div>
        <button className="admin-logout-btn" onClick={logout}>Log Keluar</button>
      </header>

      <section className="admin-dashboard-body">
        <div className="admin-stat-grid">
          <div className="admin-stat-card"><span>Jumlah Permohonan</span><strong>{members.length}</strong></div>
          <div className="admin-stat-card"><span>Pending</span><strong>{pending}</strong></div>
          <div className="admin-stat-card"><span>Approved</span><strong>{approved}</strong></div>
          <div className="admin-stat-card"><span>Rejected</span><strong>{rejected}</strong></div>
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
              <button className="admin-refresh-btn" onClick={() => loadMembers()} disabled={loading}>Refresh</button>
            </div>
          </div>

          <div className="admin-toolbar">
            <input placeholder="Cari nama, IPT, no. ahli UMNO, bahagian..." value={q} onChange={e => setQ(e.target.value)} />
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",margin:"12px 0"}}>
            <button className="admin-refresh-btn" onClick={toggleAllPending} disabled={loading}>
              Select All Pending
            </button>
            <button className="admin-approve-btn" onClick={() => bulkChange("approved")} disabled={loading || selected.length === 0}>
              Approve Selected ({selected.length})
            </button>
            <button className="admin-reject-btn" onClick={() => bulkChange("rejected")} disabled={loading || selected.length === 0}>
              Reject Selected ({selected.length})
            </button>
            {selected.length > 0 && <small>{selected.length} dipilih</small>}
          </div>

          {msg && <div className="admin-success">{msg}</div>}

          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pilih</th><th>Nama</th><th>IC</th><th>No. UMNO</th><th>IPT</th><th>Zon</th>
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
                    <td><span className={`admin-status ${m.status}`}>{m.status}</span></td>
                    <td>{m.membership_id || "—"}</td>
                    <td>
                      {m.status === "pending" ? (
                        <div className="admin-action-row">
                          <button className="admin-approve-btn" onClick={() => change(m.id,"approved")}>Approve</button>
                          <button className="admin-reject-btn" onClick={() => change(m.id,"rejected")}>Reject</button>
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
