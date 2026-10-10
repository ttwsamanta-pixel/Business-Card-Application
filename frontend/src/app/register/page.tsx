"use client";

import Link from "next/link";
import { useState } from "react";
import { endpoints, setToken } from "@/lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const res = await endpoints.register(form);
      setToken(res.token);
      location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };
  return <main className="shell"><nav className="nav"><Link href="/" className="brand"><span className="brand-mark">C</span>CardStudio</Link></nav><div className="auth-wrap"><form className="auth-card" onSubmit={submit}><h1>Create account</h1><p>Start building your QR business card.</p>{error ? <div className="error">{error}</div> : null}<label className="field">Name<input className="input" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} /></label><label className="field">Email<input className="input" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} /></label><label className="field">Password<input className="input" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} /></label><button className="btn" style={{width:"100%"}}>Create account</button><p><Link href="/login">Already have an account?</Link></p></form></div></main>;
}
