"use client";

import Link from "next/link";
import { useState } from "react";
import { endpoints } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const res = await endpoints.forgot(email);
    setMessage(`${res.message}${res.devToken ? ` Dev token: ${res.devToken}` : ""}`);
  };
  return <main className="shell"><nav className="nav"><Link href="/" className="brand"><img src="/TTW-Logo.png" alt="" className="brand-logo"/>TTW card studio</Link></nav><div className="auth-wrap"><form className="auth-card" onSubmit={submit}><h1>Reset password</h1>{message ? <div className="success">{message}</div> : null}<label className="field">Email<input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} /></label><button className="btn" style={{width:"100%"}}>Send reset link</button><p><Link href="/login">Back to login</Link></p></form></div></main>;
}
