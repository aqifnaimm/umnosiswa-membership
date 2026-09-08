import Link from "next/link";

export default function MemberDashboard() {
  return (
    <div className="dashboard-shell">
      <div className="dash-header">
        <div className="container">
          <strong>Portal Ahli UMNOSiswa</strong>
        </div>
      </div>
      <div className="container dash-grid">
        <aside className="sidebar">
          <p><strong>Menu Ahli</strong></p>
          <p className="small">Profil</p>
          <p className="small">Status Keahlian</p>
          <p className="small">Kad Digital</p>
          <Link href="/" className="small">Kembali ke laman utama</Link>
        </aside>
        <main className="panel">
          <span className="eyebrow">Papan Pemuka Ahli</span>
          <h2 style={{marginTop:10}}>Selamat datang</h2>
          <p className="small">
            Halaman ini ialah papan pemuka asas. Sambungkan data profil pengguna daripada Supabase
            selepas authentication dan approval workflow diaktifkan.
          </p>
          <div className="card" style={{marginTop:22}}>
            <h3>Status Keahlian</h3>
            <span className="badge">Dalam Semakan / Demo</span>
          </div>
        </main>
      </div>
    </div>
  );
}
