:root {
  --red: #e51b23;
  --black: #111111;
  --muted: #6b7280;
  --line: #e5e7eb;
  --bg: #f7f7f8;
  --white: #ffffff;
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  color: var(--black);
  background: var(--bg);
}

a { color: inherit; text-decoration: none; }

.container {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255,255,255,.96);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(8px);
}

.nav-inner {
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
}

.brand img {
  width: 150px;
  height: auto;
  display: block;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 12px 18px;
  border: 1px solid transparent;
  font-weight: 700;
  cursor: pointer;
  transition: .2s ease;
}

.btn-primary {
  background: var(--red);
  color: white;
}

.btn-primary:hover { filter: brightness(.94); }

.btn-outline {
  background: white;
  border-color: var(--line);
}

.hero {
  background:
    radial-gradient(circle at top right, rgba(229,27,35,.12), transparent 34%),
    linear-gradient(180deg,#fff 0%,#f8f8f8 100%);
  padding: 88px 0 76px;
  border-bottom: 1px solid var(--line);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr .85fr;
  gap: 48px;
  align-items: center;
}

.eyebrow {
  display: inline-block;
  color: var(--red);
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  font-size: 13px;
}

h1 {
  font-size: clamp(42px, 7vw, 72px);
  line-height: .98;
  margin: 16px 0 20px;
  letter-spacing: -.04em;
}

h2 {
  font-size: clamp(28px, 4vw, 42px);
  margin: 0 0 14px;
}

.lead {
  font-size: 19px;
  line-height: 1.65;
  color: #3f3f46;
  max-width: 720px;
}

.hero-card, .card {
  background: white;
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 14px 40px rgba(0,0,0,.06);
}

.hero-card {
  padding: 28px;
}

.hero-card img {
  width: 100%;
  border-radius: 12px;
  background: white;
}

.section {
  padding: 68px 0;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 20px;
}

.card {
  padding: 24px;
}

.card h3 { margin-top: 0; }

.small {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.form-wrap {
  width: min(760px, calc(100% - 32px));
  margin: 42px auto 72px;
}

.form-card {
  background: white;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 14px 36px rgba(0,0,0,.05);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field.full { grid-column: 1 / -1; }

label {
  font-size: 14px;
  font-weight: 700;
}

input, select {
  width: 100%;
  border: 1px solid #d4d4d8;
  border-radius: 10px;
  min-height: 46px;
  padding: 10px 12px;
  font-size: 15px;
  background: #fff;
}

input:focus, select:focus {
  outline: 3px solid rgba(229,27,35,.10);
  border-color: var(--red);
}

.notice {
  background: #fff7f7;
  border: 1px solid #ffd6d9;
  padding: 14px 16px;
  border-radius: 10px;
  color: #5b1d22;
  font-size: 13px;
  line-height: 1.55;
}

.status {
  padding: 12px 14px;
  border-radius: 10px;
  margin-top: 14px;
  font-size: 14px;
}

.status.ok { background: #ecfdf3; color: #166534; }
.status.err { background: #fef2f2; color: #991b1b; }

.dashboard-shell {
  min-height: 100vh;
  background: #f5f5f5;
}

.dash-header {
  background: #111;
  color: #fff;
  padding: 24px 0;
}

.dash-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 22px;
  padding: 28px 0;
}

.sidebar, .panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
}

.sidebar { padding: 18px; }
.panel { padding: 24px; }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 16px;
  margin-bottom: 18px;
}

.kpi {
  background: white;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px;
}

.kpi strong {
  display: block;
  font-size: 30px;
  margin-top: 6px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 13px 10px;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
}

.badge {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: #fff7ed;
  color: #9a3412;
}

.footer {
  border-top: 1px solid var(--line);
  background: white;
  padding: 28px 0;
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 820px) {
  .hero-grid, .grid-3, .dash-grid, .kpi-grid, .form-grid {
    grid-template-columns: 1fr;
  }
  .nav-links a:not(.btn) { display: none; }
  .field.full { grid-column: auto; }
  .hero { padding-top: 56px; }
}
