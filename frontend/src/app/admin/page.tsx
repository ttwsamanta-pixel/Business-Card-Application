"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { endpoints } from "@/lib/api";

export default function AdminPage() {
  const [overview, setOverview] = useState<any>();
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setOverview(await endpoints.adminOverview());
      setUsers(await endpoints.adminUsers());
      setTemplates(await endpoints.adminTemplates());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin data failed");
    }
  };
  useEffect(() => { load(); }, []);
  return <main className="dashboard-layout"><AppNav/><section className="main"><h1>Super Admin</h1>{error ? <div className="error">{error}</div> : null}{overview ? <div className="stat-grid">{Object.entries(overview).map(([key,value])=><div className="panel stat" key={key}><strong>{String(value)}</strong>{key}</div>)}</div> : null}<div className="grid" style={{marginTop:20}}><section className="panel"><h2>Users</h2>{users.map((user)=><p key={user.id}>{user.name} · {user.email} · {user.role} · {user.status}</p>)}</section><section className="panel"><h2>Templates</h2>{templates.map((template)=><p key={template.id} style={{display:"flex",justifyContent:"space-between",gap:12}}><span>{template.name}</span><button className="btn secondary" onClick={async()=>{await endpoints.adminSetTemplate(template.id,!template.active);load();}}>{template.active ? "Disable" : "Enable"}</button></p>)}</section></div></section></main>;
}
