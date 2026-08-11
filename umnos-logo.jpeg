const demoRows = [
  { name: "Contoh Ahli 1", ipt: "IIUM", zone: "Tengah", status: "Pending" },
  { name: "Contoh Ahli 2", ipt: "UiTM", zone: "Tengah", status: "Approved" },
];

export default function AdminPage() {
  return (
    <div className="dashboard-shell">
      <div className="dash-header">
        <div className="container">
          <strong>Admin UMNOSiswa</strong>
        </div>
      </div>

      <div className="container" style={{padding:"28px 0"}}>
        <div className="kpi-grid">
          <div className="kpi"><span className="small">Jumlah Ahli</span><strong>—</strong></div>
          <div className="kpi"><span className="small">Pending</span><strong>—</strong></div>
          <div className="kpi"><span className="small">Approved</span><strong>—</strong></div>
        </div>

        <div className="panel">
          <span className="eyebrow">Pengurusan Ahli</span>
          <h2 style={{marginTop:10}}>Permohonan Keahlian</h2>
          <p className="small">
            Jadual ini masih demo. Sambungkan kepada Supabase dan tambah perlindungan role admin
            sebelum digunakan secara production.
          </p>
          <div style={{overflowX:"auto"}}>
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>IPT</th>
                  <th>Zon</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {demoRows.map((row, i) => (
                  <tr key={i}>
                    <td>{row.name}</td>
                    <td>{row.ipt}</td>
                    <td>{row.zone}</td>
                    <td><span className="badge">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
