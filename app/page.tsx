import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ScrollReveal from "./ScrollReveal";

type HomeStats = {
  activeStudents: number;
  alumni: number;
  institutions: number;
};

async function getHomeStats(): Promise<HomeStats> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return { activeStudents: 0, alumni: 0, institutions: 0 };
  }

  try {
    const supabase = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await supabase
      .from("membership_applications")
      .select("ipt_name,graduation_month,graduation_year,status")
      .eq("status", "approved");

    if (error) {
      console.error("Homepage stats error:", error.message);
      return { activeStudents: 0, alumni: 0, institutions: 0 };
    }

    const rows = data || [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let activeStudents = 0;
    let alumni = 0;

    for (const row of rows) {
      const graduationYear = Number(row.graduation_year);
      const graduationMonth =
        row.graduation_month &&
        Number(row.graduation_month) >= 1 &&
        Number(row.graduation_month) <= 12
          ? Number(row.graduation_month)
          : 12;

      const isAlumni =
        graduationYear < currentYear ||
        (graduationYear === currentYear && graduationMonth < currentMonth);

      if (isAlumni) alumni += 1;
      else activeStudents += 1;
    }

    const institutions = new Set(
      rows
        .map((row) => String(row.ipt_name || "").trim().toLowerCase())
        .filter(Boolean)
    ).size;

    return {
      activeStudents,
      alumni,
      institutions
    };
  } catch (error) {
    console.error("Homepage stats exception:", error);
    return { activeStudents: 0, alumni: 0, institutions: 0 };
  }
}

export const revalidate = 60;

export default async function HomePage() {
  const stats = await getHomeStats();

  return (
    <main className="homev3-shell">
      <nav className="homev3-nav">
        <div className="homev3-container homev3-nav-inner">
          <Link href="/" className="homev3-brand">
            <div className="homev3-brand-box">
              <Image
                src="/umnos-logo.jpeg"
                alt="UMNOSiswa Malaysia"
                width={240}
                height={130}
                priority
              />
            </div>
          </Link>

          <div className="homev3-nav-links">
            <a href="#tentang">Tentang</a>
            <a href="#aktiviti">Aktiviti</a>
            <a href="#statistik">Statistik</a>
            <Link href="/portal">Portal Ahli</Link>
            <Link href="/daftar" className="homev3-nav-cta">
              Daftar Keahlian
            </Link>
          </div>
        </div>
      </nav>

      <section className="homev3-hero">
        <Image
          src="/gallery/umnos-hero.jpeg"
          alt="Aktiviti UMNOSiswa"
          fill
          priority
          className="homev3-hero-image"
          sizes="100vw"
        />
        <div className="homev3-hero-overlay" />
        <div className="homev3-hero-pattern" />

        <div className="homev3-container homev3-hero-content">
          <div className="homev3-badge">
            <span />
            PORTAL KEAHLIAN RASMI
          </div>

          <h1>
            Keahlian
            <strong>UMNOSiswa Malaysia</strong>
          </h1>

          <p>
            Platform keahlian digital untuk mahasiswa dan graduan IPT di seluruh
            Malaysia — daftar, semak status dan akses kad keahlian dalam satu sistem.
          </p>

          <div className="homev3-actions">
            <Link href="/daftar" className="homev3-primary-btn">
              Daftar Keahlian
              <span>→</span>
            </Link>
            <Link href="/portal" className="homev3-secondary-btn">
              Portal Ahli
            </Link>
          </div>

          <div className="homev3-motto">
            <span>BERSATU</span><b>•</b><span>BERSETIA</span><b>•</b><span>BERKHIDMAT</span>
          </div>
        </div>
      </section>

      <ScrollReveal className="homev3-reveal-section">\n      <section id="tentang" className="homev3-about">
        <div className="homev3-container homev3-about-grid">
          <div className="homev3-about-copy">
            <span className="homev3-kicker">TENTANG UMNOSISWA</span>
            <h2>Menghubungkan mahasiswa, kepimpinan dan khidmat masyarakat.</h2>
            <p>
              UMNOSiswa menghimpunkan mahasiswa dan graduan IPT melalui jaringan
              keahlian yang lebih tersusun, mudah disemak dan bersedia untuk
              pengurusan program serta aktiviti di seluruh Malaysia.
            </p>
            <p>
              Portal ini menjadi pusat pendaftaran, pengesahan ahli, ID keahlian
              <strong> USXXXXXX</strong> dan akses Kad Ahli Digital.
            </p>
          </div>

          <div className="homev3-photo-stack">
            <div className="homev3-photo homev3-photo-main">
              <Image
                src="/gallery/umnos-meeting-group.jpeg"
                alt="Sesi bersama mahasiswa"
                fill
                className="homev3-cover"
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>
            <div className="homev3-photo homev3-photo-small">
              <Image
                src="/gallery/umnos-meeting.jpeg"
                alt="Sesi perbincangan"
                fill
                className="homev3-cover"
                sizes="280px"
              />
            </div>
          </div>
        </div>
      </section>\n      </ScrollReveal>

      <ScrollReveal className="homev3-reveal-section">\n      <section id="aktiviti" className="homev3-activity">
        <div className="homev3-container homev3-activity-grid">
          <div className="homev3-activity-image">
            <Image
              src="/gallery/umnos-community.jpeg"
              alt="Komuniti UMNOSiswa"
              fill
              className="homev3-cover"
              sizes="(max-width: 900px) 100vw, 48vw"
            />
            <div className="homev3-activity-caption">
              <span>AKTIVITI & KOMUNITI</span>
              <strong>Gerak bersama mahasiswa</strong>
            </div>
          </div>

          <div className="homev3-activity-copy">
            <span className="homev3-kicker">AKTIVITI</span>
            <h2>Lebih daripada sekadar pendaftaran ahli.</h2>
            <p>
              Keahlian membolehkan data organisasi diurus dengan lebih baik untuk
              program, jaringan IPT, zon dan Bahagian UMNO.
            </p>

            <div className="homev3-mini-grid">
              <div><span>01</span><strong>Daftar</strong><small>Permohonan keahlian digital</small></div>
              <div><span>02</span><strong>Semak</strong><small>Admin approve atau reject</small></div>
              <div><span>03</span><strong>Aktif</strong><small>ID ahli + kad digital</small></div>
              <div><span>04</span><strong>Verify</strong><small>QR pengesahan keahlian</small></div>
            </div>
          </div>
        </div>
      </section>\n      </ScrollReveal>


      <ScrollReveal className="homev3-reveal-section">\n      <section className="homev3-card-preview">
        <div className="homev3-container homev3-card-preview-grid">
          <div className="homev3-card-preview-copy">
            <span className="homev3-kicker">KAD AHLI DIGITAL</span>
            <h2>Keahlian anda, dalam satu kad digital.</h2>
            <p>
              Ahli yang telah diluluskan akan menerima ID UMNOSiswa unik,
              status keahlian aktif dan akses kepada kad digital dengan QR verification.
            </p>

            <div className="homev3-card-preview-points">
              <div><span>✓</span><strong>ID UMNOSiswa</strong><small>Format USXXXXXX</small></div>
              <div><span>✓</span><strong>QR Verification</strong><small>Semakan keahlian pantas</small></div>
              <div><span>✓</span><strong>Status Keahlian</strong><small>ACTIVE untuk ahli diluluskan</small></div>
            </div>

            <Link href="/portal" className="homev3-primary-btn">
              Akses Portal Ahli
              <span>→</span>
            </Link>
          </div>

          <div className="homev3-card-mockup-wrap">
            <div className="homev3-card-mockup">
              <div className="homev3-card-mockup-top">
                <div className="homev3-card-mockup-logo">
                  <Image
                    src="/umnos-logo.jpeg"
                    alt="UMNOSiswa"
                    width={210}
                    height={110}
                  />
                </div>
                <span className="homev3-card-active">ACTIVE</span>
              </div>

              <div className="homev3-card-mockup-body">
                <small>KAD KEAHLIAN DIGITAL</small>
                <h3>MUHAMMAD AQIF NAIM</h3>
                <div className="homev3-card-id">US000001</div>

                <div className="homev3-card-details">
                  <div><span>IPT</span><strong>IIUM / UIAM</strong></div>
                  <div><span>ZON IPT</span><strong>Lembah Klang</strong></div>
                  <div><span>BAHAGIAN UMNO</span><strong>Lumut</strong></div>
                </div>
              </div>

              <div className="homev3-card-mockup-bottom">
                <span>BERSATU • BERSETIA • BERKHIDMAT</span>
                <div className="homev3-card-qr">
                  <div className="homev3-qr-grid">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <i key={i} className={i % 3 === 0 || i % 7 === 0 || i % 5 === 0 ? "on" : ""} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="homev3-card-shadow-card" />
          </div>
        </div>
      </section>\n      </ScrollReveal>

      <ScrollReveal className="homev3-reveal-section">\n      <section id="statistik" className="homev3-stats">
        <div className="homev3-container">
          <div className="homev3-section-head">
            <span className="homev3-kicker">STATISTIK KEAHLIAN</span>
            <h2>Satu sistem untuk seluruh rangkaian IPT.</h2>
            <p>
              Statistik keahlian dikemaskini secara automatik berdasarkan rekod ahli yang telah diluluskan.
            </p>
          </div>

          <div className="homev3-stat-grid homev3-stat-grid-four">
            <article><span>Active Student</span><strong>{stats.activeStudents}</strong><small>Ahli approved yang masih dalam tempoh pengajian</small></article>
            <article><span>Alumni</span><strong>{stats.alumni}</strong><small>Ahli approved yang telah tamat pengajian</small></article>
            <article><span>IPT Terlibat</span><strong>{stats.institutions}</strong><small>Institusi dengan ahli aktif atau alumni</small></article>
            <article><span>Zon IPT</span><strong>6</strong><small>Utara, Lembah Klang, Selatan, Pantai Timur, Sabah, Sarawak</small></article>
          </div>
        </div>
      </section>\n      </ScrollReveal>

      <ScrollReveal className="homev3-reveal-section">\n      <section className="homev3-cta">
        <div className="homev3-container">
          <div className="homev3-cta-card">
            <div>
              <span className="homev3-kicker">SERTAI UMNOSISWA</span>
              <h2>Mulakan pendaftaran anda.</h2>
              <p>Sediakan No. Ahli UMNO, maklumat IPT, zon IPT dan Bahagian UMNO.</p>
            </div>
            <Link href="/daftar" className="homev3-primary-btn">
              Daftar Sekarang
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>\n      </ScrollReveal>

      <footer className="homev3-footer">
        <div className="homev3-container homev3-footer-inner">
          <div>
            <strong>UMNOSiswa Malaysia</strong>
            <small>Portal Keahlian Digital</small>
          </div>
          <div>BERSATU • BERSETIA • BERKHIDMAT</div>
          <div>© 2026 UMNOSiswa Malaysia</div>
        </div>
      </footer> 
    </main>
  );
}
