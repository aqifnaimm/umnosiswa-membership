"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type M = {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  ic_number: string;
  umno_member_no: string;
  ipt_name: string;
  graduation_year: number;
  ipt_zone: string;
  umno_division: string;
  status: "pending" | "approved" | "rejected";
  membership_id: string | null;
};

export default function AdminPage() {
  const [members, setMembers] = useState<M[]>([]);
  const [key, setKey] = useState("");
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  async function load(k = key) {
    setLoading(true);
    setMsg("");

    try {
      const r = await fetch("/api/admin/applications", {
        headers: { "x-admin-key": k }
      });
      const d = await r.json();

      if (!r.ok) {
        setOk(false);
        setMsg(d.error || "Gagal.");
        return;
      }

      setMembers(d.members || []);
      setOk(true);
    } catch {
      setMsg("Tidak dapat berhubung dengan server.");
    } finally {
      setLoading(false);
    }
  }

  async function change(id: string, status: "approved" | "rejected") {
    if (!confirm(`Teruskan ${status}?`)) return;

    setLoading(true);
    setMsg("");

    try {
      const r = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": key
        },
        body: JSON.stringify({ id, status })
      });

      const d = await r.json();

      if (!r.ok) {
        setMsg(d.error || "Gagal.");
        return;
      }

      setMsg(
        status === "approved"
          ? `Diluluskan${d.member?.membership_id ? ` — ${d.member.membership_id}` : ""}.`
          : "Permohonan ditolak."
      );

      await load();
    } catch {
      setMsg("Tidak dapat mengemaskini permohonan.");
    } finally {
      setLoading(false);
    }
  }

  const shown = useMemo(() => {
    return members.filter((m) => {
      const text = [
        m.full_name,
        m.email,
        m.phone_number,
        m.umno_member_no,
        m.ipt_name,
        m.ipt_zone,
        m.umno_division,
        m.membership_id || ""
      ]
        .join(" ")
        .toLowerCase();

      return (
        (filter === "all" || m.status === filter) &&
        text.includes(q.toLowerCase())
      );
    });
  }, [members, q, filter]);

  const mask = (x: string) => {
    const d = x.replace(/\D/g, "");
    return d.length >= 4 ? `******-**-${d.slice(-4)}` : "****";
  };

  if (!ok) {
    return (
      <main className="admin-login-shell">
        <div className="admin-login-overlay" />
        <div className="admin-watermark">
          <Image
            src="/umnos-logo.jpeg"
            alt=""
            width={600}
            height={400}
            priority
          />
        </div>

        <section className="admin-login-content">
          <div className="admin-brand-wrap">
            <div className="admin-logo-frame">
              <Image
                src="/umnos-logo.jpeg"
                alt="UMNOSiswa Malaysia"
                width={300}
                height={180}
                priority
              />
            </div>

            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">
              Masukkan kunci akses untuk meneruskan
            </p>
            <div className="admin-title-line" />
          </div>

          <div className="admin-glass-card">
            <div className="admin-lock-icon">🔒</div>

            <label className="admin-field-label">Kunci Akses</label>

            <div className="admin-input-wrap">
              <input
                className="admin-key-input"
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Masukkan admin dashboard key"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && key && !loading) load(key);
                }}
              />
              <button
                type="button"
                className="admin-eye-btn"
                onClick={() => setShowKey((v) => !v)}
                aria-label="Papar atau sembunyikan admin key"
              >
                {showKey ? "🙈" : "👁"}
              </button>
            </div>

            <button
              className="admin-login-btn"
              disabled={!key || loading}
              onClick={() => load(key)}
            >
              <span>{loading ? "Menyemak..." : "Log Masuk"}</span>
              <span>→</span>
            </button>

            {msg && <div className="admin-error">{msg}</div>}

            <div className="admin-divider">
              <span />
              <small>UMNOSISWA</small>
              <span />
            </div>

            <p className="admin-motto">
              BERSATU <b>•</b> BERKHIDMAT <b>•</b> BERKORBAN
            </p>
          </div>
        </section>
      </main>
    );
  }

  const pending = members.filter((m) => m.status === "pending").length;
  const approved = members.filter((m) => m.status === "approved").length;
  const rejected = members.filter((m) => m.status === "rejected").length;

  return (
    <main className="admin-dashboard-shell">
      <header className="admin-dash-header">
        <div>
          <span className="admin-dash-kicker">UMNOSISWA MALAYSIA</span>
          <h1>Dashboard Pentadbir</h1>
        </div>

        <button
          className="admin-logout-btn"
          onClick={() => {
            setOk(false);
            setKey("");
            setMembers([]);
          }}
        >
          Log Keluar
        </button>
      </header>

      <section className="admin-dashboard-body">
        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <span>Jumlah Permohonan</span>
            <strong>{members.length}</strong>
          </div>
          <div className="admin-stat-card">
            <span>Pending</span>
            <strong>{pending}</strong>
          </div>
          <div className="admin-stat-card">
            <span>Approved</span>
            <strong>{approved}</strong>
          </div>
          <div className="admin-stat-card">
            <span>Rejected</span>
            <strong>{rejected}</strong>
          </div>
        </div>

        <div className="admin-data-card">
          <div className="admin-data-head">
            <div>
              <span className="admin-dash-kicker">PENGURUSAN AHLI</span>
              <h2>Permohonan Keahlian</h2>
            </div>

            <button
              className="admin-refresh-btn"
              onClick={() => load()}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <div className="admin-toolbar">
            <input
              placeholder="Cari nama, IPT, no. ahli UMNO, bahagian..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {msg && <div className="admin-success">{msg}</div>}

          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>IC</th>
                  <th>No. UMNO</th>
                  <th>IPT</th>
                  <th>Zon</th>
                  <th>Bahagian</th>
                  <th>Status</th>
                  <th>ID</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.full_name}</strong>
                      <small>{m.email}</small>
                    </td>
                    <td>{mask(m.ic_number)}</td>
                    <td>{m.umno_member_no}</td>
                    <td>
                      {m.ipt_name}
                      <small>Tamat {m.graduation_year}</small>
                    </td>
                    <td>{m.ipt_zone}</td>
                    <td>{m.umno_division}</td>
                    <td>
                      <span className={`admin-status ${m.status}`}>
                        {m.status}
                      </span>
                    </td>
                    <td>{m.membership_id || "—"}</td>
                    <td>
                      {m.status === "pending" ? (
                        <div className="admin-action-row">
                          <button
                            className="admin-approve-btn"
                            onClick={() => change(m.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="admin-reject-btn"
                            onClick={() => change(m.id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="admin-done">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}

                {shown.length === 0 && (
                  <tr>
                    <td colSpan={9} className="admin-empty">
                      Tiada rekod ditemui.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
