"use client";

import Link from "next/link";
import { useState } from "react";
import { endpoints, setToken } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const res = await endpoints.login({ email, password });
      setToken(res.token);
      location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };
  return <main className="shell"><nav className="nav"><Link href="/" className="brand"><img src="/TTW-Logo.png" alt="" className="brand-logo"/>TTW card studio</Link></nav><div className="auth-wrap"><form className="auth-card" onSubmit={submit}><h1>Login</h1><p>Access is managed by the super admin.</p>{error ? <div className="error">{error}</div> : null}<label className="field">Email<input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} /></label><label className="field">Password<input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></label><button className="btn" style={{width:"100%"}}>Login</button><p><Link href="/forgot-password">Forgot password?</Link></p></form></div></main>;
}
