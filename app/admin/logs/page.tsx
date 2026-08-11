"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function AuditLogsPage(){
  const [logs,setLogs]=useState<Log[]>([]);
  const [me,setMe]=useState<any>(null);
  const [q,setQ]=useState("");
  const [action,setAction]=useState("all");
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(true);

  async function token(){
    const {data}=await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function load(){
    setLoading(true); setMsg("");
    const t=await token();
    if(!t){window.location.href="/admin";return;}
    try{
      const r=await fetch("/api/admin/logs",{headers:{Authorization:`Bearer ${t}`}});
      const d=await r.json();
      if(!r.ok){
        setMsg(d.error||"Gagal mendapatkan audit log.");
        if(r.status===401||r.status===403) setTimeout(()=>window.location.href="/admin",900);
        return;
      }
      setLogs(d.logs||[]);
      setMe(d.me);
    }catch{
      setMsg("Tidak dapat berhubung dengan server.");
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[]);

  const actions=useMemo(()=>Array.from(new Set(logs.map(x=>x.action))).sort(),[logs]);

  const shown=useMemo(()=>{
    const needle=q.toLowerCase();
    return logs.filter(x=>{
      const meta=JSON.stringify(x.metadata||{}).toLowerCase();
      const hay=`${x.admin_email||""} ${x.action} ${meta}`.toLowerCase();
      return (action==="all"||x.action===action)&&hay.includes(needle);
    });
  },[logs,q,action]);

  function label(a:string){
    const map:Record<string,string>={
      approve_member:"Lulus Ahli",
      reject_member:"Tolak Ahli",
      create_admin:"Tambah Admin",
      update_admin:"Kemaskini Admin"
    };
    return map[a]||a.replaceAll("_"," ");
  }

  function detail(l:Log){
    const m=l.metadata||{};
    if(l.action==="approve_member"||l.action==="reject_member")
      return [m.member_name,m.membership_id].filter(Boolean).join(" · ")||"Permohonan ahli";
    if(l.action==="create_admin")
      return `${m.created_admin_email||"Admin baru"}${m.role?` · ${m.role}`:""}`;
    if(l.action==="update_admin")
      return `${m.target_admin||"Admin"}${m.changes?` · ${JSON.stringify(m.changes)}`:""}`;
    return Object.keys(m).length?JSON.stringify(m):"—";
  }

  return <main className="audit-shell">
    <div className="audit-wrap">
      <header className="audit-header">
        <div>
          <span>UMNOSISWA MALAYSIA</span>
          <h1>Audit Log</h1>
          <p>Rekod aktiviti pentadbir dalam sistem keahlian.</p>
        </div>
        <div className="audit-header-actions">
          <Link href="/admin/admins">Manage Admins</Link>
          <Link href="/admin">← Dashboard</Link>
        </div>
      </header>

      <section className="audit-stats">
        <div><span>Jumlah Aktiviti</span><strong>{logs.length}</strong></div>
        <div><span>Approve</span><strong>{logs.filter(x=>x.action==="approve_member").length}</strong></div>
        <div><span>Reject</span><strong>{logs.filter(x=>x.action==="reject_member").length}</strong></div>
        <div><span>Admin Actions</span><strong>{logs.filter(x=>x.action.includes("admin")).length}</strong></div>
      </section>

      <section className="audit-card">
        <div className="audit-card-head">
          <div>
            <span className="audit-kicker">SECURITY & ACCOUNTABILITY</span>
            <h2>Aktiviti Pentadbir</h2>
            {me&&<small>Logged in: {me.email}</small>}
          </div>
          <button onClick={load} disabled={loading}>{loading?"Loading...":"Refresh"}</button>
        </div>

        <div className="audit-toolbar">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari admin, nama ahli, ID ahli..."/>
          <select value={action} onChange={e=>setAction(e.target.value)}>
            <option value="all">Semua Tindakan</option>
            {actions.map(a=><option key={a} value={a}>{label(a)}</option>)}
          </select>
        </div>

        {msg&&<div className="audit-msg">{msg}</div>}

        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead><tr><th>Tarikh / Masa</th><th>Admin</th><th>Tindakan</th><th>Butiran</th></tr></thead>
            <tbody>
              {shown.map(l=><tr key={l.id}>
                <td>
                  <strong>{new Date(l.created_at).toLocaleDateString("ms-MY")}</strong>
                  <small>{new Date(l.created_at).toLocaleTimeString("ms-MY",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</small>
                </td>
                <td>{l.admin_email||"Unknown"}</td>
                <td><span className={`audit-action ${l.action}`}>{label(l.action)}</span></td>
                <td className="audit-detail">{detail(l)}</td>
              </tr>)}
              {!loading&&shown.length===0&&<tr><td colSpan={4} className="audit-empty">Tiada rekod ditemui.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
}
