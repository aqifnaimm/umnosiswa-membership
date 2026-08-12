"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const IPTS = ["UM", "UKM", "UMPSA", "UMK", "UNIMAP", "UNISZA", "USIM", "UNIKL", "UITM", "UTHM", "UPSI", "USM", "UPM", "UUM", "UTEM", "UMT", "UMS", "UIAM"];

type Admin = {
  id: string;
  auth_user_id: string;
  email: string;
  username: string | null;
  role: "super_admin" | "admin";
  ipt_scope: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdminManagementPage() {
  const [admins,setAdmins]=useState<Admin[]>([]);
  const [me,setMe]=useState<any>(null);
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [role,setRole]=useState<"admin"|"super_admin">("admin");
  const [iptScope,setIptScope]=useState("UIAM");
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
    const r=await fetch("/api/admin/users",{headers:{Authorization:`Bearer ${t}`}});
    const d=await r.json();
    if(!r.ok){setMsg(d.error||"Akses tidak dibenarkan.");setLoading(false);return;}
    setAdmins(d.admins||[]); setMe(d.me); setLoading(false);
  }

  useEffect(()=>{load()},[]);

  async function createAdmin(){
    if(!username.trim() || password.length<8) {
      setMsg("Masukkan username dan kata laluan sekurang-kurangnya 8 aksara.");
      return;
    }
    setLoading(true); setMsg("");
    const t=await token();
    const r=await fetch("/api/admin/users",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},
      body:JSON.stringify({
        username:username.trim().toLowerCase(),
        password,
        role,
        ipt_scope: role==="admin" ? iptScope : null
      })
    });
    const d=await r.json();
    if(!r.ok){setMsg(d.error||"Gagal tambah admin.");setLoading(false);return;}
    setUsername("");setPassword("");setRole("admin");setIptScope("UIAM");
    setMsg("Admin baru berjaya ditambah.");
    await load();
  }

  async function updateAdmin(id:string, patch:any){
    setLoading(true);setMsg("");
    const t=await token();
    const r=await fetch(`/api/admin/users/${id}`,{
      method:"PATCH",
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},
      body:JSON.stringify(patch)
    });
    const d=await r.json();
    if(!r.ok){setMsg(d.error||"Gagal kemaskini admin.");setLoading(false);return;}
    setMsg("Admin berjaya dikemaskini.");
    await load();
  }

  return <main className="admin-manage-shell">
    <div className="admin-manage-wrap">
      <div className="admin-manage-nav">
        <div>
          <span>UMNOSISWA MALAYSIA</span>
          <h1>Pengurusan Admin</h1>
          <p>Tambah admin, tetapkan role, skop IPT dan aktif/nonaktif akaun.</p>
        </div>
        <Link href="/admin">← Dashboard</Link>
      </div>

      {msg && <div className="admin-manage-msg">{msg}</div>}

      {me?.role==="super_admin" && <section className="admin-create-box">
        <div>
          <span className="admin-manage-kicker">SUPER ADMIN</span>
          <h2>Tambah Admin Baru</h2>
        </div>
        <div className="admin-create-grid">
          <input type="text" placeholder="Username admin" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username"/>
          <input type="password" placeholder="Kata laluan sementara" value={password} onChange={e=>setPassword(e.target.value)}/>
          <select value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="admin">Admin IPT</option>
            <option value="super_admin">Super Admin</option>
          </select>
          {role==="admin" ? (
            <select value={iptScope} onChange={e=>setIptScope(e.target.value)}>
              {IPTS.map(ipt=><option key={ipt} value={ipt}>{ipt}</option>)}
            </select>
          ) : (
            <input value="Semua IPT" disabled aria-label="Skop Super Admin" />
          )}
          <button onClick={createAdmin} disabled={loading}>Tambah Admin</button>
        </div>
      </section>}

      <section className="admin-list-box">
        <div className="admin-list-head">
          <div><span className="admin-manage-kicker">AKAUN PENTADBIR</span><h2>Senarai Admin</h2></div>
          <strong>{admins.length} akaun</strong>
        </div>

        <div className="admin-manage-table-wrap">
          <table className="admin-manage-table">
            <thead><tr><th>Username</th><th>Role</th><th>Skop IPT</th><th>Status</th><th>Dicipta</th><th>Tindakan</th></tr></thead>
            <tbody>
              {admins.map(a=><tr key={a.id}>
                <td><strong>{a.username || "—"}</strong>{a.auth_user_id===me?.userId&&<small> Akaun anda</small>}</td>
                <td><span className={`admin-role-chip ${a.role}`}>{a.role==="super_admin"?"Super Admin":"Admin IPT"}</span></td>
                <td>
                  {a.role==="super_admin" ? (
                    <strong>Semua IPT</strong>
                  ) : me?.role==="super_admin" ? (
                    <select
                      value={a.ipt_scope || ""}
                      disabled={a.auth_user_id===me.userId || loading}
                      onChange={e=>updateAdmin(a.id,{ipt_scope:e.target.value})}
                    >
                      <option value="" disabled>Pilih IPT</option>
                      {IPTS.map(ipt=><option key={ipt} value={ipt}>{ipt}</option>)}
                    </select>
                  ) : (
                    <strong>{a.ipt_scope || "Belum ditetapkan"}</strong>
                  )}
                </td>
                <td><span className={`admin-account-status ${a.is_active?"on":"off"}`}>{a.is_active?"Aktif":"Tidak Aktif"}</span></td>
                <td>{new Date(a.created_at).toLocaleDateString("ms-MY")}</td>
                <td>
                  {me?.role==="super_admin" ? <div className="admin-manage-actions">
                    <select value={a.role} disabled={a.auth_user_id===me.userId || loading}
                      onChange={e=>{
                        const nextRole=e.target.value as "admin"|"super_admin";
                        if(nextRole==="admin" && !a.ipt_scope){
                          setMsg("Untuk tukar Super Admin kepada Admin IPT, tetapkan skop IPT melalui API atau cipta Admin IPT baru.");
                          return;
                        }
                        updateAdmin(a.id,{role:nextRole});
                      }}>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <button
                      disabled={a.auth_user_id===me.userId || loading}
                      onClick={()=>updateAdmin(a.id,{is_active:!a.is_active})}>
                      {a.is_active?"Deactivate":"Activate"}
                    </button>
                  </div> : "—"}
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
}
