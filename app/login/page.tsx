"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) setError(error.message);
    else setMessage("Pautan log masuk telah dihantar ke e-mel anda.");
  }

  return (
    <div className="form-wrap">
      <Link href="/" className="small">← Kembali ke laman utama</Link>
      <div style={{marginTop:20}}>
        <span className="eyebrow">Portal Ahli</span>
        <h2 style={{marginTop:10}}>Log Masuk</h2>
      </div>
      <form className="form-card" onSubmit={submit}>
        <div className="field">
          <label>E-mel</label>
          <input name="email" type="email" required />
        </div>
        <button className="btn btn-primary" style={{marginTop:18}}>Hantar Pautan Log Masuk</button>
        {message && <div className="status ok">{message}</div>}
        {error && <div className="status err">{error}</div>}
      </form>
    </div>
  );
}
