import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <Image src="/umnos-logo.jpeg" alt="UMNOSiswa" width={180} height={120} />
          </Link>
          <div className="nav-links">
            <a href="#tentang">Tentang</a>
            <a href="#keahlian">Keahlian</a>
            <Link href="/login">Login</Link>
            <Link className="btn btn-primary" href="/daftar">Daftar Sekarang</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">Portal Keahlian Rasmi</span>
              <h1>Keahlian UMNOSiswa Malaysia</h1>
              <p className="lead">
                Platform pendaftaran dan pengurusan ahli UMNOSiswa untuk mahasiswa
                dan graduan IPT di seluruh Malaysia.
              </p>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:26}}>
                <Link className="btn btn-primary" href="/daftar">Daftar Sebagai Ahli</Link>
                <Link className="btn btn-outline" href="/login">Portal Ahli</Link>
              </div>
            </div>

            <div className="hero-card">
              <Image
                src="/umnos-logo.jpeg"
                alt="Logo UMNOSiswa"
                width={800}
                height={600}
                priority
              />
              <p className="small" style={{marginBottom:0}}>
                Pendaftaran akan disemak oleh pentadbir sebelum status keahlian diaktifkan.
              </p>
            </div>
          </div>
        </section>

        <section id="tentang" className="section">
          <div className="container">
            <span className="eyebrow">Tentang Portal</span>
            <h2>Satu sistem untuk semua ahli</h2>
            <div className="grid-3" style={{marginTop:28}}>
              <div className="card">
                <h3>Pendaftaran Mudah</h3>
                <p className="small">Isi maklumat keahlian, IPT dan Bahagian UMNO dalam satu borang.</p>
              </div>
              <div className="card">
                <h3>Semakan Pentadbir</h3>
                <p className="small">Setiap permohonan boleh melalui proses semakan sebelum diluluskan.</p>
              </div>
              <div className="card">
                <h3>Portal Ahli</h3>
                <p className="small">Ahli yang diluluskan boleh mempunyai profil dan nombor keahlian UMNOSiswa.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="keahlian" className="section" style={{paddingTop:0}}>
          <div className="container">
            <div className="card" style={{textAlign:"center",padding:"42px 24px"}}>
              <span className="eyebrow">Sertai UMNOSiswa</span>
              <h2 style={{marginTop:12}}>Mulakan pendaftaran anda</h2>
              <p className="lead" style={{margin:"0 auto 24px",fontSize:17}}>
                Sediakan nombor ahli UMNO, maklumat IPT, zon IPT dan Bahagian UMNO anda.
              </p>
              <Link className="btn btn-primary" href="/daftar">Buka Borang Pendaftaran</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">© 2026 UMNOSiswa Malaysia. Portal keahlian.</div>
      </footer>
    </>
  );
}
