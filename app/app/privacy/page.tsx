import Link from "next/link";

export const metadata = {
  title: "Notis Privasi | UMNOSiswa Malaysia",
  description: "Notis Privasi Portal Keahlian UMNOSiswa Malaysia"
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page-shell">
      <div className="privacy-page-bg" />

      <section className="privacy-page-wrap">
        <Link href="/daftar" className="privacy-back">
          ← Kembali ke Borang Keahlian
        </Link>

        <header className="privacy-hero">
          <span>UMNOSISWA MALAYSIA</span>
          <h1>Notis Privasi</h1>
          <p>
            Notis ini menerangkan bagaimana data peribadi yang diberikan melalui Portal
            Keahlian UMNOSiswa Malaysia dikumpul, digunakan, diurus dan dilindungi.
          </p>
          <small>Tarikh kemas kini: 12 Ogos 2026</small>
        </header>

        <article className="privacy-document">
          <section>
            <h2>1. Pengenalan</h2>
            <p>
              UMNOSiswa Malaysia menghormati privasi anda dan komited untuk mengurus data
              peribadi yang diberikan melalui Portal Keahlian UMNOSiswa Malaysia secara
              bertanggungjawab dan bagi tujuan yang berkaitan dengan pengurusan keahlian.
            </p>
          </section>

          <section>
            <h2>2. Data Peribadi yang Dikumpul</h2>
            <p>Data yang mungkin dikumpul melalui permohonan keahlian termasuk:</p>
            <ul>
              <li>nama penuh;</li>
              <li>nombor telefon;</li>
              <li>alamat e-mel;</li>
              <li>nombor kad pengenalan;</li>
              <li>nombor Ahli UMNO;</li>
              <li>institusi pengajian tinggi (IPT) dan kampus;</li>
              <li>bulan dan tahun tamat pengajian;</li>
              <li>zon IPT; dan</li>
              <li>Bahagian UMNO.</li>
            </ul>
          </section>

          <section>
            <h2>3. Tujuan Pemprosesan Data</h2>
            <p>Data peribadi anda boleh digunakan bagi tujuan berikut:</p>
            <ul>
              <li>memproses, menyemak dan mengesahkan permohonan keahlian;</li>
              <li>mengeluarkan ID dan Kad Ahli Digital UMNOSiswa;</li>
              <li>mengurus rekod ahli mengikut IPT, kampus, zon dan Bahagian UMNO;</li>
              <li>mengurus program, aktiviti, jaringan mahasiswa dan alumni;</li>
              <li>menghubungi anda berhubung status atau urusan keahlian;</li>
              <li>melaksanakan analitik dalaman dan perancangan organisasi; dan</li>
              <li>menjaga keselamatan, integriti dan ketepatan rekod keahlian.</li>
            </ul>
          </section>

          <section>
            <h2>4. Akses dan Pendedahan Data</h2>
            <p>
              Data peribadi hanya boleh diakses oleh pentadbir atau pegawai UMNOSiswa
              Malaysia yang diberi kuasa mengikut tugas dan skop pentadbiran masing-masing.
              Data tidak akan didedahkan kepada pihak yang tidak berkaitan kecuali apabila
              diperlukan bagi tujuan pentadbiran yang sah, keselamatan sistem, pematuhan
              undang-undang, atau apabila anda telah memberikan persetujuan yang sesuai.
            </p>
          </section>

          <section>
            <h2>5. Keselamatan Data</h2>
            <p>
              Langkah keselamatan yang munasabah akan digunakan bagi mengurangkan risiko
              kehilangan, penyalahgunaan, akses tanpa kebenaran, pengubahsuaian atau
              pendedahan data peribadi. Akses pentadbir adalah tertakluk kepada pengesahan
              akaun dan kawalan akses sistem.
            </p>
          </section>

          <section>
            <h2>6. Penyimpanan Data</h2>
            <p>
              Data akan disimpan selama mana diperlukan untuk pengurusan keahlian,
              pentadbiran organisasi, rekod aktiviti dan tujuan lain yang dinyatakan dalam
              notis ini. Data yang tidak lagi diperlukan boleh dipadam, dinyahaktif atau
              diarkibkan mengikut keperluan pentadbiran yang munasabah.
            </p>
          </section>

          <section>
            <h2>7. Ketepatan Maklumat</h2>
            <p>
              Pemohon bertanggungjawab memastikan maklumat yang diberikan adalah tepat,
              lengkap dan terkini. Sekiranya terdapat perubahan atau kesilapan, anda boleh
              memohon supaya maklumat tersebut dikemas kini atau diperbetulkan.
            </p>
          </section>

          <section>
            <h2>8. Hak dan Permintaan Berkaitan Data</h2>
            <p>
              Anda boleh menghubungi UMNOSiswa Malaysia untuk membuat pertanyaan atau
              permohonan berkaitan akses, pembetulan atau kemas kini data peribadi yang
              disimpan, tertakluk kepada keperluan pentadbiran dan undang-undang yang
              berkenaan.
            </p>
          </section>

          <section>
            <h2>9. Persetujuan</h2>
            <p>
              Dengan menandakan kotak persetujuan dan menghantar borang permohonan
              keahlian, anda mengakui bahawa anda telah membaca dan memahami Notis Privasi
              ini serta bersetuju data peribadi anda diproses bagi tujuan yang dinyatakan.
            </p>
          </section>

          <section>
            <h2>10. Perubahan kepada Notis Privasi</h2>
            <p>
              UMNOSiswa Malaysia boleh mengemas kini Notis Privasi ini dari semasa ke
              semasa bagi mencerminkan perubahan kepada sistem, operasi atau keperluan
              pentadbiran. Versi terkini akan dipaparkan melalui Portal Keahlian.
            </p>
          </section>

          <section className="privacy-contact">
            <h2>11. Hubungi Kami</h2>
            <p>Untuk pertanyaan berkaitan privasi dan data peribadi:</p>
            <strong>UMNOSiswa Malaysia</strong>
            <a href="mailto:mahasiswaumno@gmail.com">mahasiswaumno@gmail.com</a>
          </section>
        </article>

        <div className="privacy-bottom-actions">
          <Link href="/daftar">Kembali ke Borang Keahlian</Link>
          <Link href="/">Laman Utama</Link>
        </div>
      </section>
    </main>
  );
}
