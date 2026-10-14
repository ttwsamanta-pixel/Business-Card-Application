"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { endpoints } from "@/lib/api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await endpoints.reset(token, password);
    setMessage("Password changed. You can log in now.");
  };
  return <main className="shell"><nav className="nav"><Link href="/" className="brand"><img src="/TTW-Logo.png" alt="" className="brand-logo"/>TTW card studio</Link></nav><div className="auth-wrap"><form className="auth-card" onSubmit={submit}><h1>Choose a new password</h1>{message ? <div className="success">{message}</div> : null}<label className="field">Token<input className="input" value={token} onChange={(e)=>setToken(e.target.value)} /></label><label className="field">New password<input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></label><button className="btn" style={{width:"100%"}}>Reset password</button><p><Link href="/login">Back to login</Link></p></form></div></main>;
}
