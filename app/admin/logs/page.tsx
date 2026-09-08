"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Log = {
  id: number;
  admin_email: string | null;
  action: string;
  target_application_id: string | null;
  metadata: any;
  created_at: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [me, setMe] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setMsg("");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || "";

    if (!token) {
      window.location.href = "/admin";
      return;
    }

    try {
      const r = await fetch("/api/admin/logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();

      if (!r.ok) {
        setMsg(d.error || "Gagal mendapatkan audit log.");
        if (r.status === 401 || r.status === 403) {
          setTimeout(() => (window.location.href = "/admin"), 900);
        }
        return;
      }

      setLogs(d.logs || []);
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

  function label(action: string) {
    const map: Record<string, string> = {
      approve_member: "Lulus Ahli",
      reject_member: "Tolak Ahli",
      edit_member: "Edit Ahli",
      delete_member: "Padam Ahli",
      create_admin: "Tambah Pentadbir",
      edit_admin: "Edit Pentadbir",
      update_admin: "Kemas Kini Pentadbir",
      delete_admin: "Padam Pentadbir",
      update_system_settings: "Kemas Kini Tetapan Sistem",
      change_own_password: "Tukar Kata Laluan",
    };
    return map[action] || action.replaceAll("_", " ");
  }

  function memberDetail(m: any) {
    return [m?.member_name, m?.membership_id].filter(Boolean).join(" · ");
  }

  function detail(log: Log) {
    const m = log.metadata || {};

    switch (log.action) {
      case "create_admin":
        return [
          m.created_admin_email || m.created_admin_username || "Pentadbir baharu",
          m.role === "super_admin" ? "Pentadbir Utama" : "Pentadbir",
        ].filter(Boolean).join(" · ");

      case "delete_admin":
        return [
          m.deleted_admin_email || m.deleted_admin_username || "Pentadbir",
          m.role === "super_admin" ? "Pentadbir Utama" : "Pentadbir",
        ].filter(Boolean).join(" · ");

      case "edit_admin":
      case "update_admin":
        return [m.target_admin || m.edited_admin_email || "Pentadbir"].filter(Boolean).join(" · ");

      case "approve_member":
      case "reject_member":
      case "delete_member":
      case "edit_member":
        return memberDetail(m) || "Ahli";

      case "update_system_settings":
        return "Tetapan Sistem";

      case "change_own_password":
        return "Akaun sendiri";

      default:
        return "—";
    }
  }

  return (
    <main className="audit-shell">
      <div className="audit-wrap">
        <header className="audit-header">
          <div>
            <span>UMNOSISWA MALAYSIA</span>
            <h1>Audit Trail</h1>
            <p>Rekod ringkas tindakan pentadbir.</p>
          </div>
          <div className="audit-header-actions">
            <Link href="/admin/admins">Urus Pentadbir</Link>
            <Link href="/admin">← Papan Pemuka</Link>
          </div>
        </header>

        <section className="audit-card">
          <div className="audit-card-head">
            <div>
              <span className="audit-kicker">REKOD AKTIVITI</span>
              <h2>Aktiviti Pentadbir</h2>
              {me && <small>Log masuk: {me.email}</small>}
            </div>
            <button onClick={load} disabled={loading}>
              {loading ? "Memuatkan..." : "Muat Semula"}
            </button>
          </div>

          {msg && <div className="audit-msg">{msg}</div>}

          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Tarikh / Masa</th>
                  <th>Pentadbir</th>
                  <th>Tindakan</th>
                  <th>Butiran</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <strong>
                        {new Date(log.created_at).toLocaleDateString("ms-MY")}
                      </strong>
                      <small>
                        {new Date(log.created_at).toLocaleTimeString("ms-MY", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })} PTG
                      </small>
                    </td>
                    <td>{log.admin_email || "Tidak diketahui"}</td>
                    <td>
                      <span className={`audit-action ${log.action}`}>
                        {label(log.action)}
                      </span>
                    </td>
                    <td className="audit-detail">{detail(log)}</td>
                  </tr>
                ))}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="audit-empty">
                      Tiada rekod ditemui.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
