"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { endpoints } from "@/lib/api";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "disabled";
};

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: ManagedUser["role"];
  status: ManagedUser["status"];
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "user",
  status: "active"
};

export default function AdminPage() {
  const [overview, setOverview] = useState<Record<string, number>>();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      setError("");
      setOverview(await endpoints.adminOverview());
      setUsers(await endpoints.adminUsers());
      setTemplates(await endpoints.adminTemplates());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin data failed");
    }
  };

  useEffect(() => { load(); }, []);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => [user.name, user.email, user.role, user.status].some((value) => value.toLowerCase().includes(term)));
  }, [query, users]);

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      await endpoints.adminCreateUser(form);
      setForm(emptyForm);
      setMessage("User created. Share the email and temporary password with them securely.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "User creation failed");
    }
  };

  const updateStatus = async (id: string, status: ManagedUser["status"]) => {
    await endpoints.adminSetUserStatus(id, status);
    await load();
  };

  const updateRole = async (id: string, role: ManagedUser["role"]) => {
    await endpoints.adminSetUserRole(id, role);
    await load();
  };

  const deleteUser = async (user: ManagedUser) => {
    if (!confirm(`Delete ${user.name}? This also removes their cards and cannot be undone.`)) return;
    await endpoints.adminDeleteUser(user.id);
    setMessage(`${user.name} was deleted.`);
    await load();
  };

  return (
    <main className="dashboard-layout">
      <AppNav/>
      <section className="main">
        <div className="toolbar">
          <div>
            <h1>Super Admin</h1>
            <p>Create user accounts, control access, and manage template availability.</p>
          </div>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {message ? <div className="success">{message}</div> : null}

        {overview ? (
          <div className="stat-grid">
            {Object.entries(overview).map(([key, value]) => (
              <div className="panel stat" key={key}><strong>{String(value)}</strong>{key}</div>
            ))}
          </div>
        ) : null}

        <div className="admin-grid">
          <section className="panel">
            <h2>Create User</h2>
            <form className="form-grid" onSubmit={createUser}>
              <label className="field">Name<input className="input" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})}/></label>
              <label className="field">Email<input className="input" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})}/></label>
              <label className="field">Temporary password<input className="input" type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})}/></label>
              <label className="field">Role<select className="select" value={form.role} onChange={(e)=>setForm({...form, role: e.target.value as ManagedUser["role"]})}><option value="user">User</option><option value="admin">Admin</option></select></label>
              <label className="field">Status<select className="select" value={form.status} onChange={(e)=>setForm({...form, status: e.target.value as ManagedUser["status"]})}><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
              <button className="btn" style={{alignSelf:"end"}}>Create user</button>
            </form>
          </section>

          <section className="panel">
            <div className="toolbar">
              <h2>Users</h2>
              <input className="input" style={{maxWidth:260}} placeholder="Search users" value={query} onChange={(e)=>setQuery(e.target.value)}/>
            </div>
            <div className="admin-table">
              <div className="admin-row admin-head"><span>User</span><span>Role</span><span>Status</span><span>Action</span></div>
              {filteredUsers.map((user) => (
                <div className="admin-row" key={user.id}>
                  <span><strong>{user.name}</strong><small>{user.email}</small></span>
                  <select className="select" value={user.role} onChange={(e)=>updateRole(user.id, e.target.value as ManagedUser["role"])}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select className="select" value={user.status} onChange={(e)=>updateStatus(user.id, e.target.value as ManagedUser["status"])}>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                  <button className="btn danger" onClick={()=>deleteUser(user)}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel" style={{marginTop:20}}>
          <h2>Templates</h2>
          <div className="template-admin-list">
            {templates.map((template) => (
              <div key={template.id} className="admin-row">
                <span><strong>{template.name}</strong><small>{template.category}</small></span>
                <button className="btn secondary" onClick={async()=>{await endpoints.adminSetTemplate(template.id, !template.active); load();}}>
                  {template.active ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
