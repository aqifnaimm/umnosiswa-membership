"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Log = {
  id: number;
  admin_email: string | null;
  action: string;
  metadata: any;
  created_at: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

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
        setMsg(d.error || "Gagal mendapatkan audit trail.");
        if (r.status === 401 || r.status === 403) {
          setTimeout(() => (window.location.href = "/admin"), 900);
        }
        return;
      }
      setLogs(d.logs || []);
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
      approve_member: "LULUS AHLI",
      reject_member: "TOLAK AHLI",
      edit_member: "EDIT AHLI",
      delete_member: "PADAM AHLI",
      create_admin: "TAMBAH PENTADBIR",
      edit_admin: "EDIT PENTADBIR",
      update_admin: "KEMAS KINI PENTADBIR",
      delete_admin: "PADAM PENTADBIR",
      update_system_settings: "KEMAS KINI TETAPAN SISTEM",
      change_own_password: "TUKAR KATA LALUAN",
    };
    return map[action] || action.replaceAll("_", " ").toUpperCase();
  }

  function detail(log: Log) {
    const m = log.metadata || {};

    if (log.action === "create_admin") {
      return [
        m.created_admin_email,
        m.role === "super_admin" ? "Pentadbir Utama" : "Pentadbir",
      ].filter(Boolean).join(" · ") || "Pentadbir baharu";
    }

    if (log.action === "delete_admin") {
      return [
        m.deleted_admin_email,
        m.role === "super_admin" ? "Pentadbir Utama" : "Pentadbir",
      ].filter(Boolean).join(" · ") || "Pentadbir";
    }

    if (log.action === "edit_admin" || log.action === "update_admin") {
      return m.target_admin || m.edited_admin_email || "Pentadbir";
    }

    if (log.action === "approve_member" || log.action === "reject_member") {
      return [m.member_name, m.membership_id].filter(Boolean).join(" · ") || "Ahli";
    }

    if (log.action === "edit_member" || log.action === "delete_member") {
      return [m.member_name, m.membership_id].filter(Boolean).join(" · ") || "Ahli";
    }

    if (log.action === "update_system_settings") return "Tetapan sistem dikemas kini";
    if (log.action === "change_own_password") return "Kata laluan pentadbir dikemas kini";

    return "—";
  }

  return (
    <main className="audit-shell">
      <div className="audit-wrap">
        <header className="audit-header audit-header-simple">
          <div>
            <span>UMNOSISWA MALAYSIA</span>
            <h1>Audit Trail</h1>
            <p>Rekod ringkas tindakan pentadbir.</p>
          </div>
          <div className="audit-header-actions">
            <Link href="/admin">← Papan Pemuka</Link>
          </div>
        </header>

        <section className="audit-card audit-card-simple">
          <div className="audit-card-head">
            <div>
              <h2>Aktiviti Pentadbir</h2>
              <small>Setiap tindakan direkodkan secara automatik.</small>
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
                {logs.map((log) => {
                  const date = new Date(log.created_at);
                  return (
                    <tr key={log.id}>
                      <td>
                        <strong>{date.toLocaleDateString("ms-MY")}</strong>
                        <small>
                          {date.toLocaleTimeString("ms-MY", {
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
                      <td className="audit-detail-simple">{detail(log)}</td>
                    </tr>
                  );
                })}
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
