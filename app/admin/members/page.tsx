"use client";

import { useEffect, useMemo, useState } from "react";
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
  created_at: string;
};

const ZONES = ["Utara","Lembah Klang","Selatan","Pantai Timur","Sabah","Sarawak"];
const MONTHS = [
  "Januari","Februari","Mac","April","Mei","Jun",
  "Julai","Ogos","September","Oktober","November","Disember"
];

export default function MemberManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [me, setMe] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [iptFilter, setIptFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentStatusFilter, setStudentStatusFilter] = useState("all");
  const [graduationFilter, setGraduationFilter] = useState("all");
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState<Partial<Member>>({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

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
      const r = await fetch("/api/admin/members", {
        headers: { Authorization: `Bearer ${t}` }
      });
      const d = await r.json();

      if (!r.ok) {
        setMsg(d.error || "Gagal mendapatkan data ahli.");
        if (r.status === 401 || r.status === 403) {
          setTimeout(() => window.location.href = "/admin", 800);
        }
        return;
      }

      setMembers(d.members || []);
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

  const ipts = useMemo(() => {
    return Array.from(
      new Set(members.map(m => m.ipt_name?.trim()).filter(Boolean))
    ).sort((a,b) => a.localeCompare(b));
  }, [members]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();

    return members.filter(m => {
      const haystack = [
        m.full_name,
        m.email,
        m.phone_number,
        m.ic_number,
        m.umno_member_no,
        m.ipt_name,
        m.ipt_zone,
        m.umno_division,
        m.membership_id || ""
      ].join(" ").toLowerCase();

      return (
        (!q || haystack.includes(q)) &&
        (iptFilter === "all" || m.ipt_name === iptFilter) &&
        (zoneFilter === "all" || m.ipt_zone === zoneFilter) &&
        (statusFilter === "all" || m.status === statusFilter) &&
        (studentStatusFilter === "all" || studentStatus(m) === studentStatusFilter) &&
        (
          graduationFilter === "all" ||
          (graduationFilter === "next6" && isGraduatingSoon(m)) ||
          (graduationFilter === "thisYear" && m.graduation_year === new Date().getFullYear())
        )
      );
    });
  }, [members, search, iptFilter, zoneFilter, statusFilter, studentStatusFilter, graduationFilter]);

  function openEdit(m: Member) {
    setEditing(m);
    setForm({ ...m });
    setMsg("");
  }

  async function saveEdit() {
    if (!editing) return;

    setLoading(true);
    setMsg("");

    const t = await token();

    try {
      const payload = {
        id: editing.id,
        full_name: form.full_name,
        phone_number: form.phone_number,
        email: form.email,
        ic_number: form.ic_number,
        umno_member_no: form.umno_member_no,
        ipt_name: form.ipt_name,
        graduation_month: form.graduation_month ? Number(form.graduation_month) : null,
        graduation_year: Number(form.graduation_year),
        ipt_zone: form.ipt_zone,
        umno_division: form.umno_division
      };

      const r = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`
        },
        body: JSON.stringify(payload)
      });

      const d = await r.json();

      if (!r.ok) {
        setMsg(d.error || "Gagal mengemaskini ahli.");
        return;
      }

      setEditing(null);
      setForm({});
      setMsg("Data ahli berjaya dikemaskini.");
      await load();
    } catch {
      setMsg("Tidak dapat mengemaskini data ahli.");
    } finally {
      setLoading(false);
    }
  }

  function maskIC(ic: string) {
    const d = String(ic || "").replace(/\D/g, "");
    return d.length >= 4 ? `******-**-${d.slice(-4)}` : "****";
  }

  function graduationLabel(month: number | null, year: number) {
    if (!month || month < 1 || month > 12) return `Tamat ${year}`;
    return `Tamat ${MONTHS[month - 1]} ${year}`;
  }

  function studentStatus(m: Member) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const graduationMonth =
      m.graduation_month && m.graduation_month >= 1 && m.graduation_month <= 12
        ? m.graduation_month
        : 12;

    return (
      m.graduation_year < currentYear ||
      (m.graduation_year === currentYear && graduationMonth < currentMonth)
    )
      ? "alumni"
      : "active_student";
  }

  function monthsUntilGraduation(m: Member) {
    const now = new Date();
    const currentIndex = now.getFullYear() * 12 + now.getMonth();
    const graduationMonth =
      m.graduation_month && m.graduation_month >= 1 && m.graduation_month <= 12
        ? m.graduation_month
        : 12;
    const graduationIndex = m.graduation_year * 12 + (graduationMonth - 1);
    return graduationIndex - currentIndex;
  }

  function isGraduatingSoon(m: Member) {
    const months = monthsUntilGraduation(m);
    return studentStatus(m) === "active_student" && months >= 0 && months <= 6;
  }

  function exportCSV() {
    if (!shown.length) {
      setMsg("Tiada data untuk dieksport berdasarkan filter semasa.");
      return;
    }

    const headers = [
      "Nama Penuh", "ID UMNOSiswa", "No. Ahli UMNO", "Email", "Telefon",
      "No. IC", "IPT", "Bulan Tamat", "Tahun Tamat", "Zon IPT",
      "Bahagian UMNO", "Status Kelulusan", "Status Pelajar", "Bulan Ke Tamat", "Tarikh Daftar"
    ];

    const csvEscape = (value: unknown) => {
      const str = String(value ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = shown.map(m => [
      m.full_name,
      m.membership_id || "",
      m.umno_member_no,
      m.email,
      m.phone_number,
      m.ic_number,
      m.ipt_name,
      m.graduation_month ? MONTHS[m.graduation_month - 1] : "",
      m.graduation_year,
      m.ipt_zone,
      m.umno_division,
      m.status,
      studentStatus(m) === "alumni" ? "Alumni" : "Active Student",
      studentStatus(m) === "alumni" ? "" : Math.max(0, monthsUntilGraduation(m)),
      new Date(m.created_at).toLocaleDateString("ms-MY")
    ]);

    const csv = "\uFEFF" + [headers, ...rows]
      .map(row => row.map(csvEscape).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filterName = [
      iptFilter !== "all" ? iptFilter : "Semua-IPT",
      zoneFilter !== "all" ? zoneFilter : "Semua-Zon",
      statusFilter !== "all" ? statusFilter : "Semua-Status",
      studentStatusFilter !== "all" ? studentStatusFilter : "Semua-Status-Pelajar",
      graduationFilter !== "all" ? graduationFilter : "Semua-Tarikh-Tamat"
    ].join("_").replace(/[^a-zA-Z0-9_-]+/g, "-");

    a.href = url;
    a.download = `UMNOSiswa_Ahli_${filterName}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg(`${shown.length} rekod berjaya dieksport.`);
  }

  const activeStudents = members.filter(m => studentStatus(m) === "active_student").length;
  const alumniCount = members.filter(m => studentStatus(m) === "alumni").length;
  const graduatingSoon = members.filter(isGraduatingSoon).length;
  const graduatingThisYear = members.filter(m => m.graduation_year === new Date().getFullYear()).length;

  return (
    <main className="member-admin-shell">
      <div className="member-admin-wrap">
        <header className="member-admin-header">
          <div>
            <span>UMNOSISWA MALAYSIA</span>
            <h1>Carian & Data Ahli</h1>
            <p>Cari ahli mengikut IPT, zon, status dan kemaskini maklumat jika perlu.</p>
          </div>
          <div className="member-admin-header-actions">
            <Link href="/admin/logs">Audit Log</Link>
            <Link href="/admin">← Dashboard</Link>
          </div>
        </header>

        <section className="member-admin-stats">
          <div><span>Active Student</span><strong>{activeStudents}</strong></div>
          <div><span>Alumni</span><strong>{alumniCount}</strong></div>
          <div><span>Tamat ≤ 6 Bulan</span><strong>{graduatingSoon}</strong></div>
          <div><span>Tamat Tahun Ini</span><strong>{graduatingThisYear}</strong></div>
        </section>

        <section className="member-admin-card">
          <div className="member-admin-title-row">
            <div>
              <span className="member-admin-kicker">PENGURUSAN DATA</span>
              <h2>Senarai Ahli</h2>
              {me && <small>Logged in: {me.email}</small>}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={exportCSV} disabled={loading || shown.length === 0}>Export CSV</button>
              <button onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
            </div>
          </div>

          <div className="member-admin-filters">
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Cari nama, ID US, No. UMNO, email, Bahagian..."
            />

            <select value={iptFilter} onChange={e=>setIptFilter(e.target.value)}>
              <option value="all">Semua IPT</option>
              {ipts.map(ipt => <option key={ipt} value={ipt}>{ipt}</option>)}
            </select>

            <select value={zoneFilter} onChange={e=>setZoneFilter(e.target.value)}>
              <option value="all">Semua Zon</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>

            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select value={studentStatusFilter} onChange={e=>setStudentStatusFilter(e.target.value)}>
              <option value="all">Semua Status Pelajar</option>
              <option value="active_student">Active Student</option>
              <option value="alumni">Alumni</option>
            </select>

            <select value={graduationFilter} onChange={e=>setGraduationFilter(e.target.value)}>
              <option value="all">Semua Tarikh Tamat</option>
              <option value="next6">Akan Tamat ≤ 6 Bulan</option>
              <option value="thisYear">Tamat Tahun Ini</option>
            </select>
          </div>

          {msg && <div className="member-admin-msg">{msg}</div>}

          <div style={{
            margin:"12px 0 18px",
            padding:"14px 16px",
            borderRadius:12,
            background:"#fff7ed",
            border:"1px solid #fed7aa",
            color:"#9a3412",
            fontSize:12,
            lineHeight:1.6
          }}>
            <strong>Auto Alumni:</strong> Status dikira automatik berdasarkan bulan dan tahun tamat pengajian.
            Rekod lama tanpa bulan menggunakan Disember sebagai fallback.
          </div>

          <div className="member-admin-table-wrap">
            <table className="member-admin-table">
              <thead>
                <tr>
                  <th>Ahli</th>
                  <th>ID</th>
                  <th>IPT</th>
                  <th>Zon</th>
                  <th>Bahagian</th>
                  <th>No. UMNO</th>
                  <th>IC</th>
                  <th>Status Kelulusan</th>
                  <th>Status Pelajar</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(m => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.full_name}</strong>
                      <small>{m.email}</small>
                      <small>{m.phone_number}</small>
                    </td>
                    <td>{m.membership_id || "—"}</td>
                    <td>
                      {m.ipt_name}
                      <small>{graduationLabel(m.graduation_month, m.graduation_year)}</small>
                      {isGraduatingSoon(m) && (
                        <small style={{color:"#b45309",fontWeight:700}}>
                          Akan tamat dalam {monthsUntilGraduation(m)} bulan
                        </small>
                      )}
                    </td>
                    <td>{m.ipt_zone}</td>
                    <td>{m.umno_division}</td>
                    <td>{m.umno_member_no}</td>
                    <td>{maskIC(m.ic_number)}</td>
                    <td>
                      <span className={`member-admin-status ${m.status}`}>{m.status}</span>
                    </td>
                    <td>
                      <span className={`member-admin-status ${studentStatus(m) === "alumni" ? "rejected" : "approved"}`}>
                        {studentStatus(m) === "alumni" ? "Alumni" : "Active Student"}
                      </span>
                    </td>
                    <td>
                      <button className="member-admin-edit-btn" onClick={()=>openEdit(m)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && shown.length === 0 && (
                  <tr>
                    <td colSpan={10} className="member-admin-empty">Tiada rekod ditemui.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editing && (
        <div className="member-edit-backdrop" onMouseDown={()=>setEditing(null)}>
          <div className="member-edit-modal" onMouseDown={e=>e.stopPropagation()}>
            <div className="member-edit-head">
              <div>
                <span>EDIT DATA AHLI</span>
                <h2>{editing.full_name}</h2>
                <small>{editing.membership_id || "Belum ada ID UMNOSiswa"}</small>
              </div>
              <button onClick={()=>setEditing(null)}>×</button>
            </div>

            <div className="member-edit-grid">
              <label>
                Nama Penuh
                <input value={String(form.full_name || "")} onChange={e=>setForm({...form,full_name:e.target.value})}/>
              </label>

              <label>
                Nombor Telefon
                <input value={String(form.phone_number || "")} onChange={e=>setForm({...form,phone_number:e.target.value})}/>
              </label>

              <label>
                Email
                <input type="email" value={String(form.email || "")} onChange={e=>setForm({...form,email:e.target.value})}/>
              </label>

              <label>
                Nombor IC
                <input value={String(form.ic_number || "")} onChange={e=>setForm({...form,ic_number:e.target.value})}/>
              </label>

              <label>
                No. Ahli UMNO
                <input value={String(form.umno_member_no || "")} onChange={e=>setForm({...form,umno_member_no:e.target.value})}/>
              </label>

              <label>
                IPT
                <input value={String(form.ipt_name || "")} onChange={e=>setForm({...form,ipt_name:e.target.value})}/>
              </label>

              <label>
                Bulan Tamat
                <select
                  value={form.graduation_month ? String(form.graduation_month) : ""}
                  onChange={e=>setForm({...form,graduation_month:e.target.value ? Number(e.target.value) : null})}
                >
                  <option value="">Belum ditetapkan</option>
                  {MONTHS.map((month,index)=>(
                    <option key={month} value={index + 1}>{month}</option>
                  ))}
                </select>
              </label>

              <label>
                Tahun Tamat
                <input type="number" min="2020" max="2040" value={String(form.graduation_year || "")} onChange={e=>setForm({...form,graduation_year:Number(e.target.value)})}/>
              </label>

              <label>
                Zon IPT
                <select value={String(form.ipt_zone || "")} onChange={e=>setForm({...form,ipt_zone:e.target.value})}>
                  {ZONES.map(z=><option key={z} value={z}>{z}</option>)}
                </select>
              </label>

              <label className="member-edit-full">
                Bahagian UMNO
                <input value={String(form.umno_division || "")} onChange={e=>setForm({...form,umno_division:e.target.value})}/>
              </label>
            </div>

            <div className="member-edit-note">
              ID UMNOSiswa dan status kelulusan tidak diubah melalui editor ini.
              Gunakan dashboard approval untuk status.
            </div>

            <div className="member-edit-actions">
              <button className="member-edit-cancel" onClick={()=>setEditing(null)}>Batal</button>
              <button className="member-edit-save" disabled={loading} onClick={saveEdit}>
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
