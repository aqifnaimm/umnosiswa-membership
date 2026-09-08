import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ScrollReveal from "./ScrollReveal";
import MembershipCheck from "./MembershipCheck";

type HomeStats = {
  activeStudents: number;
  alumni: number;
  institutions: number;
};

type PublicSettings = {
  org_name: string;
  motto: string;
  registration_open: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
};

const defaultSettings: PublicSettings = {
  org_name: "UMNOSiswa Malaysia",
  motto: "BERSATU • BERSETIA • BERKHIDMAT",
  registration_open: true,
  maintenance_mode: false,
  maintenance_message: "Sistem sedang diselenggara. Sila cuba sebentar lagi."
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

async function getPublicSettings(): Promise<PublicSettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return defaultSettings;

  try {
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase
      .from("system_settings")
      .select("org_name,motto,registration_open,maintenance_mode,maintenance_message")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return defaultSettings;
    return { ...defaultSettings, ...data };
  } catch {
    return defaultSettings;
  }
}

export const revalidate = 60;

export default async function HomePage() {
  const [stats, settings] = await Promise.all([getHomeStats(), getPublicSettings()]);

  return (
    <main className="homev3-shell">
      {settings.maintenance_mode && (
        <div className="homev3-maintenance-overlay">
          <div className="homev3-maintenance-card">
            <span>UMNOSISWA MALAYSIA</span>
            <h1>Sistem Dalam Penyelenggaraan</h1>
            <p>{settings.maintenance_message}</p>
            <small>Sila cuba semula sebentar lagi.</small>
          </div>
        </div>
      )}
      <nav className="homev3-nav">
        <div className="homev3-container homev3-nav-inner">
          <Link href="/" className="homev3-brand">
            <div className="homev3-brand-box">
              <Image
                src="/umnos-logo.jpeg"
                alt={settings.org_name}
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
            <a href="#semakan">Semakan Keahlian</a>
            <Link href="/portal">Portal Ahli</Link>
            <a href="mailto:mahasiswaumno@gmail.com">Hubungi Kami</a>
            <Link href={settings.registration_open ? "/daftar" : "#pendaftaran"} className="homev3-nav-cta">
              {settings.registration_open ? "Daftar Keahlian" : "Pendaftaran Ditutup"}
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
            <strong>{settings.org_name}</strong>
          </h1>

          <p>
            Platform keahlian digital untuk mahasiswa dan graduan IPT di seluruh
            Malaysia — daftar, semak status dan akses kad keahlian dalam satu sistem.
          </p>

          <div className="homev3-actions">
            <Link href={settings.registration_open ? "/daftar" : "#pendaftaran"} className="homev3-primary-btn">
              {settings.registration_open ? "Daftar Keahlian" : "Pendaftaran Ditutup"}
              <span>→</span>
            </Link>
            <Link href="/portal" className="homev3-secondary-btn">
              Portal Ahli
            </Link>
          </div>

          <div className="homev3-motto">
            <span>{settings.motto}</span>
          </div>
        </div>
      </section>

      <ScrollReveal className="homev3-reveal-section">
      <section id="tentang" className="homev3-about">
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
      </section>
      </ScrollReveal>

      <ScrollReveal className="homev3-reveal-section">
      <section id="aktiviti" className="homev3-activity">
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
              <div><span>02</span><strong>Semak</strong><small>Pentadbir meluluskan atau menolak</small></div>
              <div><span>03</span><strong>Aktif</strong><small>ID ahli + kad digital</small></div>
              <div><span>04</span><strong>Pengesahan</strong><small>QR pengesahan keahlian</small></div>
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>


      <ScrollReveal className="homev3-reveal-section">
      <section className="homev3-card-preview">
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
              <div><span>✓</span><strong>Status Keahlian</strong><small>AKTIF untuk ahli yang diluluskan</small></div>
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
                <span className="homev3-card-active">AKTIF</span>
              </div>

              <div className="homev3-card-mockup-body">
                <small>KAD KEAHLIAN DIGITAL</small>
                <h3>MUHAMMAD AQIF NAIM</h3>
                <div className="homev3-card-id">US000002</div>

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
      </section>
      </ScrollReveal>

      <ScrollReveal className="homev3-reveal-section">
        <section id="semakan" className="homev3-membership-check-section">
          <div className="homev3-container">
            <div className="homev3-section-head">
              <span className="homev3-kicker">SEMAKAN KEAHLIAN</span>
              <h2>Semak status keahlian anda.</h2>
              <p>Masukkan nombor kad pengenalan untuk menyemak rekod keahlian UMNOSiswa.</p>
            </div>
            <MembershipCheck registrationOpen={settings.registration_open} />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal className="homev3-reveal-section">
      <section id="statistik" className="homev3-stats">
        <div className="homev3-container">
          <div className="homev3-section-head">
            <span className="homev3-kicker">STATISTIK KEAHLIAN</span>
            <h2>Satu sistem untuk seluruh rangkaian IPT.</h2>
            <p>
              Statistik keahlian dikemaskini secara automatik berdasarkan rekod ahli yang telah diluluskan.
            </p>
          </div>

          <div className="homev3-stat-grid homev3-stat-grid-four">
            <article><span>Pelajar Aktif</span><strong>{stats.activeStudents}</strong><small>Ahli diluluskan yang masih dalam tempoh pengajian</small></article>
            <article><span>Alumni</span><strong>{stats.alumni}</strong><small>Ahli diluluskan yang telah tamat pengajian</small></article>
            <article><span>IPT Terlibat</span><strong>{stats.institutions}</strong><small>Institusi dengan ahli aktif atau alumni</small></article>
            <article><span>Zon IPT</span><strong>6</strong><small>Utara, Lembah Klang, Selatan, Pantai Timur, Sabah, Sarawak</small></article>
          </div>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal className="homev3-reveal-section">
      <section id="pendaftaran" className="homev3-cta">
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
      </section>
      </ScrollReveal>

      <footer className="homev3-footer">
        <div className="homev3-container homev3-footer-inner">
          <div>
            <strong>UMNOSiswa Malaysia</strong>
            <small>Portal Keahlian Digital</small>
          </div>
          <div>{settings.motto}</div>
          <div>
            <strong style={{display:"block",marginBottom:6}}>Hubungi Kami</strong>
            <a href="mailto:mahasiswaumno@gmail.com" style={{display:"block",marginBottom:4}}>mahasiswaumno@gmail.com</a>
            <a href="https://www.instagram.com/umnosiswa/" target="_blank" rel="noopener noreferrer" style={{display:"block"}}>Instagram</a>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <div>© 2026 {settings.org_name}</div>
            <Link
              href="/admin"
              aria-label="Akses Pentadbir"
              style={{
                display:"inline-flex",
                alignItems:"center",
                justifyContent:"center",
                minHeight:34,
                padding:"0 12px",
                border:"1px solid rgba(255,255,255,.12)",
                borderRadius:9,
                background:"rgba(255,255,255,.05)",
                color:"rgba(255,255,255,.62)",
                fontSize:11,
                fontWeight:800,
                letterSpacing:".04em"
              }}
            >
              Pentadbir
            </Link>
          </div>
        </div>
      </footer> 
    </main>
  );
}
