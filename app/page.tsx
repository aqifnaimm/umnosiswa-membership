import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="homev2-shell">
      <div className="homev2-bg-grid" />
      <div className="homev2-orb homev2-orb-a" />
      <div className="homev2-orb homev2-orb-b" />

      <nav className="homev2-nav">
        <div className="homev2-container homev2-nav-inner">
          <Link href="/" className="homev2-brand">
            <div className="homev2-brand-box">
              <Image
                src="/umnos-logo.jpeg"
                alt="UMNOSiswa Malaysia"
                width={240}
                height={130}
                priority
              />
            </div>
          </Link>

          <div className="homev2-nav-links">
            <a href="#tentang">Tentang</a>
            <a href="#statistik">Statistik</a>
            <Link href="/portal">Portal Ahli</Link>
            <Link href="/daftar" className="homev2-nav-cta">
              Daftar Keahlian
            </Link>
          </div>
        </div>
      </nav>

      <section className="homev2-hero">
        <div className="homev2-container homev2-hero-grid">
          <div className="homev2-hero-copy">
            <div className="homev2-badge">
              <span className="homev2-dot" />
              PORTAL KEAHLIAN RASMI
            </div>

            <h1>
              Keahlian
              <span>UMNOSiswa Malaysia</span>
            </h1>

            <p className="homev2-lead">
              Platform keahlian digital untuk mahasiswa dan graduan IPT
              di seluruh Malaysia — lebih tersusun, pantas dan mudah disemak.
            </p>

            <div className="homev2-actions">
              <Link href="/daftar" className="homev2-primary-btn">
                Daftar Keahlian
                <span>→</span>
              </Link>

              <Link href="/portal" className="homev2-secondary-btn">
                Portal Ahli
              </Link>
            </div>

            <div className="homev2-motto">
              <span>BERSATU</span>
              <b>•</b>
              <span>BERSETIA</span>
              <b>•</b>
              <span>BERKHIDMAT</span>
            </div>
          </div>

          <div className="homev2-visual">
            <div className="homev2-visual-glow" />

            <div className="homev2-visual-card">
              <div className="homev2-logo-stage">
                <Image
                  src="/umnos-logo.jpeg"
                  alt="Logo UMNOSiswa"
                  width={760}
                  height={500}
                  priority
                />
              </div>

              <div className="homev2-card-bottom">
                <div>
                  <small>SISTEM KEAHLIAN DIGITAL</small>
                  <strong>Daftar • Semak • Aktif</strong>
                </div>

                <div className="homev2-live-chip">
                  <span />
                  LIVE
                </div>
              </div>
            </div>

            <div className="homev2-float-card homev2-float-one">
              <small>ID AHLI</small>
              <strong>US000001</strong>
            </div>

            <div className="homev2-float-card homev2-float-two">
              <small>STATUS</small>
              <strong>ACTIVE</strong>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="homev2-about">
        <div className="homev2-container homev2-about-grid">
          <div>
            <span className="homev2-kicker">TENTANG UMNOSISWA</span>
            <h2>Platform keahlian untuk generasi mahasiswa</h2>
          </div>

          <div className="homev2-about-copy">
            <p>
              Portal ini dibangunkan untuk memudahkan pengurusan pendaftaran,
              semakan permohonan, pengesahan ahli dan akses kad keahlian digital.
            </p>
            <p>
              Ahli yang diluluskan akan menerima ID UMNOSiswa unik dalam format
              <strong> USXXXXXX</strong> dan boleh mengakses Portal Ahli untuk
              semakan status serta pengesahan keahlian.
            </p>
          </div>
        </div>
      </section>

      <section id="statistik" className="homev2-stats-section">
        <div className="homev2-container">
          <div className="homev2-section-head">
            <span className="homev2-kicker">STATISTIK KEAHLIAN</span>
            <h2>Satu komuniti, satu sistem</h2>
            <p>
              Ruang statistik ini boleh disambungkan kepada database untuk
              memaparkan angka sebenar secara automatik.
            </p>
          </div>

          <div className="homev2-stat-grid">
            <article className="homev2-stat-card">
              <span>01</span>
              <strong>Ahli Aktif</strong>
              <p>Jumlah ahli UMNOSiswa yang telah diluluskan.</p>
              <div className="homev2-stat-number">—</div>
            </article>

            <article className="homev2-stat-card">
              <span>02</span>
              <strong>IPT Terlibat</strong>
              <p>Institusi pengajian tinggi yang mempunyai ahli berdaftar.</p>
              <div className="homev2-stat-number">—</div>
            </article>

            <article className="homev2-stat-card">
              <span>03</span>
              <strong>Zon IPT</strong>
              <p>Keahlian merangkumi zon utama di seluruh Malaysia.</p>
              <div className="homev2-stat-number">6</div>
            </article>
          </div>
        </div>
      </section>

      <section className="homev2-cta-section">
        <div className="homev2-container">
          <div className="homev2-cta-card">
            <div>
              <span className="homev2-kicker">SERTAI UMNOSISWA</span>
              <h2>Mulakan pendaftaran anda</h2>
              <p>
                Sediakan maklumat keahlian UMNO, IPT, zon IPT dan Bahagian UMNO.
              </p>
            </div>

            <Link href="/daftar" className="homev2-primary-btn">
              Daftar Sekarang
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="homev2-footer">
        <div className="homev2-container homev2-footer-inner">
          <div>
            <strong>UMNOSiswa Malaysia</strong>
            <small>Portal Keahlian Digital</small>
          </div>

          <div className="homev2-footer-motto">
            BERSATU • BERSETIA • BERKHIDMAT
          </div>

          <div className="homev2-footer-copy">
            © 2026 UMNOSiswa Malaysia
          </div>
        </div>
      </footer>
    </main>
  );
}
