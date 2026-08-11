import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-shell">
      <div className="home-bg-grid" />

      <nav className="home-nav">
        <div className="home-container home-nav-inner">
          <Link href="/" className="home-brand">
            <div className="home-brand-box">
              <Image
                src="/umnos-logo.jpeg"
                alt="UMNOSiswa"
                width={220}
                height={120}
                priority
              />
            </div>
          </Link>

          <div className="home-nav-links">
            <a href="#tentang">Tentang</a>
            <a href="#keahlian">Keahlian</a>
            <Link href="/login">Portal Ahli</Link>
            <Link className="home-nav-btn" href="/daftar">Daftar Sekarang</Link>
          </div>
        </div>
      </nav>

      <section className="home-hero">
        <div className="home-container home-hero-grid">
          <div className="home-hero-copy">
            <span className="home-kicker">PORTAL KEAHLIAN RASMI</span>
            <h1>Keahlian UMNOSiswa Malaysia</h1>
            <p>
              Platform pendaftaran dan pengurusan keahlian untuk mahasiswa
              dan graduan IPT di seluruh Malaysia.
            </p>

            <div className="home-hero-actions">
              <Link className="home-primary-btn" href="/daftar">
                Daftar Sebagai Ahli
                <span>→</span>
              </Link>
              <Link className="home-secondary-btn" href="/login">
                Portal Ahli
              </Link>
            </div>

            <div className="home-motto">
              <span>BERSATU</span><b>•</b><span>BERSETIA</span><b>•</b><span>BERKHIDMAT</span>
            </div>
          </div>

          <div className="home-hero-card">
            <div className="home-card-glow" />
            <div className="home-logo-panel">
              <Image
                src="/umnos-logo.jpeg"
                alt="Logo UMNOSiswa"
                width={760}
                height={500}
                priority
              />
            </div>

            <div className="home-card-info">
              <div>
                <small>Status Permohonan</small>
                <strong>Semakan Pentadbir</strong>
              </div>
              <span className="home-status-dot" />
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="home-section">
        <div className="home-container">
          <div className="home-section-head">
            <span className="home-kicker">SATU SISTEM, SATU KOMUNITI</span>
            <h2>Pengurusan keahlian yang lebih tersusun</h2>
            <p>
              Daftar, semak status permohonan dan urus rekod keahlian melalui satu portal.
            </p>
          </div>

          <div className="home-feature-grid">
            <article className="home-feature-card">
              <div className="home-feature-no">01</div>
              <h3>Pendaftaran Mudah</h3>
              <p>Isi maklumat keahlian, IPT, zon dan Bahagian UMNO dalam satu borang.</p>
            </article>

            <article className="home-feature-card">
              <div className="home-feature-no">02</div>
              <h3>Semakan Pentadbir</h3>
              <p>Permohonan melalui proses semakan sebelum status keahlian diaktifkan.</p>
            </article>

            <article className="home-feature-card">
              <div className="home-feature-no">03</div>
              <h3>Nombor Ahli UMNOSiswa</h3>
              <p>Ahli yang diluluskan menerima ID keahlian UMNOSiswa secara automatik.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="keahlian" className="home-cta-section">
        <div className="home-container">
          <div className="home-cta-card">
            <div>
              <span className="home-kicker">SERTAI UMNOSISWA</span>
              <h2>Mulakan pendaftaran anda hari ini</h2>
              <p>Sediakan nombor ahli UMNO, maklumat IPT, zon IPT dan Bahagian UMNO.</p>
            </div>

            <Link className="home-primary-btn" href="/daftar">
              Buka Borang Pendaftaran
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-container home-footer-inner">
          <span>© 2026 UMNOSiswa Malaysia</span>
          <span>BERSATU • BERSETIA • BERKHIDMAT</span>
        </div>
      </footer>
    </main>
  );
}
