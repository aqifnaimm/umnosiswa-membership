"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Member = {
  id: string;
  full_name: string;
  ipt_name: string;
  ipt_zone: string;
  status: "pending" | "approved" | "rejected";
  graduation_month: number | null;
  graduation_year: number | null;
  created_at: string;
};

type Payload = {
  members: Member[];
  admin: { email: string; role: "super_admin" | "admin" };
};

const MONTHS = ["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogos","Sep","Okt","Nov","Dis"];

function isAlumni(m: Member) {
  if (m.status !== "approved" || !m.graduation_year) return false;
  const now = new Date();
  const month = m.graduation_month || 12;
  return m.graduation_year < now.getFullYear() ||
    (m.graduation_year === now.getFullYear() && month < now.getMonth() + 1);
}

function Bar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max((value / max) * 100, value ? 3 : 0) : 0;
  return <div className="analytics-bar-track"><div className="analytics-bar-fill" style={{width:`${width}%`}} /></div>;
}

export default function AnalyticsPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) { window.location.href = "/admin"; return; }

      try {
        const r = await fetch("/api/admin/analytics", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await r.json();
        if (!r.ok) {
          if (r.status === 401 || r.status === 403) window.location.href = "/admin";
          setError(d.error || "Gagal mendapatkan analytics.");
          return;
        }
        setPayload(d);
      } catch {
        setError("Tidak dapat berhubung dengan server.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const members = payload?.members || [];

  const years = useMemo(() => {
    const ys = new Set<number>();
    members.forEach(m => {
      const d = new Date(m.created_at);
      if (!Number.isNaN(d.getTime())) ys.add(d.getFullYear());
    });
    return Array.from(ys).sort((a,b) => b-a);
  }, [members]);

  const filtered = useMemo(() => {
    if (year === "all") return members;
    return members.filter(m => new Date(m.created_at).getFullYear() === Number(year));
  }, [members, year]);

  const stats = useMemo(() => {
    const pending = filtered.filter(m => m.status === "pending").length;
    const approved = filtered.filter(m => m.status === "approved").length;
    const rejected = filtered.filter(m => m.status === "rejected").length;
    const alumni = filtered.filter(isAlumni).length;
    const active = filtered.filter(m => m.status === "approved" && !isAlumni(m)).length;
    return { total: filtered.length, pending, approved, rejected, alumni, active };
  }, [filtered]);

  const monthly = useMemo(() => {
    const counts = Array(12).fill(0);
    filtered.forEach(m => {
      const d = new Date(m.created_at);
      if (!Number.isNaN(d.getTime())) counts[d.getMonth()]++;
    });
    return counts;
  }, [filtered]);

  const zones = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filter(m => m.status === "approved").forEach(m => {
      const k = m.ipt_zone || "Tidak Ditetapkan";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a,b) => b[1]-a[1]);
  }, [filtered]);

  const ipts = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filter(m => m.status === "approved").forEach(m => {
      const k = m.ipt_name || "Tidak Ditetapkan";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a,b) => b[1]-a[1]).slice(0,10);
  }, [filtered]);

  const forecast = useMemo(() => {
    const now = new Date();
    const items: {label:string; count:number}[] = [];
    for (let i=0;i<12;i++) {
      const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
      const y = d.getFullYear(), mo = d.getMonth()+1;
      const count = members.filter(m =>
        m.status === "approved" &&
        m.graduation_year === y &&
        (m.graduation_month || 12) === mo
      ).length;
      items.push({ label:`${MONTHS[mo-1]} ${y}`, count });
    }
    return items;
  }, [members]);

  if (loading) return <main className="analytics-shell"><div className="analytics-loading">Memuatkan analytics...</div></main>;

  const maxMonth = Math.max(...monthly, 1);
  const maxZone = Math.max(...zones.map(x=>x[1]), 1);
  const maxIpt = Math.max(...ipts.map(x=>x[1]), 1);
  const maxForecast = Math.max(...forecast.map(x=>x.count), 1);

  return (
    <main className="analytics-shell">
      <div className="analytics-wrap">
        <header className="analytics-header">
          <div>
            <span>UMNOSISWA MALAYSIA</span>
            <h1>Dashboard Analytics</h1>
            <p>Ringkasan data keahlian, IPT, zon dan unjuran graduasi.</p>
          </div>
          <div className="analytics-header-actions">
            <select value={year} onChange={e=>setYear(e.target.value)}>
              <option value="all">Semua Tahun</option>
              {years.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <Link href="/admin">← Dashboard</Link>
          </div>
        </header>

        {error && <div className="analytics-error">{error}</div>}

        <section className="analytics-stats">
          <div><span>Jumlah Rekod</span><strong>{stats.total}</strong></div>
          <div><span>Active Student</span><strong>{stats.active}</strong></div>
          <div><span>Alumni</span><strong>{stats.alumni}</strong></div>
          <div><span>Pending</span><strong>{stats.pending}</strong></div>
          <div><span>Approved</span><strong>{stats.approved}</strong></div>
          <div><span>Rejected</span><strong>{stats.rejected}</strong></div>
        </section>

        <section className="analytics-grid">
          <article className="analytics-card analytics-wide">
            <div className="analytics-card-head"><div><span>TREND</span><h2>Pendaftaran Mengikut Bulan</h2></div></div>
            <div className="analytics-month-chart">
              {monthly.map((v,i)=>(
                <div className="analytics-month-col" key={MONTHS[i]}>
                  <strong>{v}</strong>
                  <div className="analytics-month-track"><div style={{height:`${Math.max((v/maxMonth)*100,v?5:0)}%`}} /></div>
                  <small>{MONTHS[i]}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="analytics-card">
            <div className="analytics-card-head"><div><span>STATUS</span><h2>Active vs Alumni</h2></div></div>
            <div className="analytics-status-big">
              <div><strong>{stats.active}</strong><span>Active Student</span></div>
              <div><strong>{stats.alumni}</strong><span>Alumni</span></div>
            </div>
            <div className="analytics-split">
              <div style={{width:`${stats.approved ? stats.active/stats.approved*100 : 0}%`}} />
            </div>
          </article>

          <article className="analytics-card">
            <div className="analytics-card-head"><div><span>GEOGRAFI IPT</span><h2>Ahli Mengikut Zon</h2></div></div>
            <div className="analytics-list">
              {zones.map(([name,value])=>(
                <div key={name}><div className="analytics-list-label"><span>{name}</span><strong>{value}</strong></div><Bar value={value} max={maxZone}/></div>
              ))}
              {!zones.length && <p>Tiada data.</p>}
            </div>
          </article>

          <article className="analytics-card">
            <div className="analytics-card-head"><div><span>TOP 10</span><h2>IPT Dengan Ahli Teramai</h2></div></div>
            <div className="analytics-list">
              {ipts.map(([name,value],i)=>(
                <div key={name}><div className="analytics-list-label"><span>{i+1}. {name}</span><strong>{value}</strong></div><Bar value={value} max={maxIpt}/></div>
              ))}
              {!ipts.length && <p>Tiada data.</p>}
            </div>
          </article>

          <article className="analytics-card">
            <div className="analytics-card-head"><div><span>12 BULAN</span><h2>Graduation Forecast</h2></div></div>
            <div className="analytics-list">
              {forecast.map(x=>(
                <div key={x.label}><div className="analytics-list-label"><span>{x.label}</span><strong>{x.count}</strong></div><Bar value={x.count} max={maxForecast}/></div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
