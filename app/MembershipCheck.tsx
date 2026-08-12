"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Result =
  | {
      found: true;
      status: "approved" | "pending" | "rejected";
      full_name?: string;
      membership_id?: string | null;
      ipt_name?: string;
      campus?: string | null;
      ipt_zone?: string;
      umno_division?: string;
      student_status?: "active_student" | "alumni";
    }
  | { found: false };

export default function MembershipCheck({
  registrationOpen
}: {
  registrationOpen: boolean;
}) {
  const [ic, setIc] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    const normalized = ic.replace(/\D/g, "");
    if (normalized.length < 8) {
      setError("Sila masukkan nombor kad pengenalan yang sah.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/check-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ic_number: ic })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Semakan gagal.");
      setResult(d);
    } catch (e: any) {
      setError(e.message || "Semakan gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="homev3-check-card">
      <form onSubmit={submit} className="homev3-check-form">
        <div>
          <label>Nombor Kad Pengenalan</label>
          <input
            value={ic}
            onChange={e => setIc(e.target.value)}
            placeholder="Contoh: 010101-01-1234"
            inputMode="numeric"
            autoComplete="off"
            required
          />
          <small>No. IC digunakan untuk semakan sahaja dan tidak dipaparkan pada keputusan.</small>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Menyemak..." : "Semak Keahlian"}
        </button>
      </form>

      {error && <div className="homev3-check-result error">{error}</div>}

      {result?.found && result.status === "approved" && (
        <div className="homev3-check-result approved">
          <span className="homev3-check-badge">✓ KEAHLIAN SAH</span>
          <h3>{result.full_name}</h3>
          <strong className="homev3-check-id">{result.membership_id}</strong>
          <div className="homev3-check-details">
            <div><span>IPT</span><strong>{result.ipt_name || "—"}</strong></div>
            <div><span>Kampus</span><strong>{result.campus || "—"}</strong></div>
            <div><span>Zon IPT</span><strong>{result.ipt_zone || "—"}</strong></div>
            <div><span>Bahagian UMNO</span><strong>{result.umno_division || "—"}</strong></div>
            <div><span>Status</span><strong>{result.student_status === "alumni" ? "Alumni" : "Active Student"}</strong></div>
          </div>
          {result.membership_id && (
            <Link href={`/verify/${result.membership_id}`} className="homev3-check-link">
              Buka Pengesahan Rasmi →
            </Link>
          )}
        </div>
      )}

      {result?.found && result.status === "pending" && (
        <div className="homev3-check-result pending">
          <span className="homev3-check-badge">DALAM SEMAKAN</span>
          <h3>Permohonan Sedang Disemak</h3>
          <p>Permohonan anda telah diterima dan masih menunggu kelulusan pentadbir.</p>
          <Link href="/portal" className="homev3-check-link">Portal Ahli →</Link>
        </div>
      )}

      {result?.found && result.status === "rejected" && (
        <div className="homev3-check-result rejected">
          <span className="homev3-check-badge">TIDAK DILULUSKAN</span>
          <h3>Permohonan Tidak Diluluskan</h3>
          <p>Sila hubungi pentadbir UMNOSiswa jika anda memerlukan semakan lanjut.</p>
        </div>
      )}

      {result && !result.found && (
        <div className="homev3-check-result not-found">
          <span className="homev3-check-badge">TIADA REKOD KEAHLIAN</span>
          <h3>Anda Masih Belum Menjadi Ahli UMNOSiswa</h3>
          <p>Tiada rekod keahlian ditemui berdasarkan nombor kad pengenalan tersebut.</p>
          {registrationOpen ? (
            <Link href="/daftar" className="homev3-check-register">Daftar Keahlian →</Link>
          ) : (
            <span className="homev3-check-closed">Pendaftaran sedang ditutup</span>
          )}
        </div>
      )}
    </div>
  );
}
