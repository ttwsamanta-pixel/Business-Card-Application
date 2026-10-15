"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, X } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { PublicCardDialog } from "@/components/PublicCardDialog";
import { endpoints } from "@/lib/api";
import { menus } from "@/lib/permissions";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "disabled";
  permissions: string[];
};
const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "user" as "user" | "admin",
  status: "active" as "active" | "disabled",
};
const reports: Record<string, string> = {
  users: "Total Users",
  activeUsers: "Active Users",
  cards: "Total Cards",
  publishedCards: "Published Cards",
  draftCards: "Draft Cards",
  templates: "Templates",
};
export default function AdminPage() {
  const [overview, setOverview] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<ManagedUser[]>([]),
    [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm),
    [editing, setEditing] = useState<ManagedUser | null>(null),
    [showForm, setShowForm] = useState(false);
  const [permissionUser, setPermissionUser] = useState<ManagedUser | null>(
      null,
    ),
    [permissions, setPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [self, setSelf] = useState("");
  async function load() {
    setOverview(await endpoints.adminOverview());
    setUsers(await endpoints.adminUsers());
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
    endpoints
      .me()
      .then((r) => setSelf(r.user.id))
      .catch(() => {});
  }, []);
  async function act(work: () => Promise<unknown>, notice: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
      await load();
      setShowForm(false);
      setPermissionUser(null);
      setMessage(notice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save changes");
    } finally {
      setBusy(false);
    }
  }
  const filtered = users.filter((u) =>
    `${u.name} ${u.email} ${u.role} ${u.status}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const close = () => {
    if (!busy) {
      setShowForm(false);
      setPermissionUser(null);
      setError("");
    }
  };
  return (
    <main className="dashboard-layout">
      <AppNav />
      <section className="main users-page">
        <h1>Users</h1>
        {error && !showForm && !permissionUser && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}
        <div className="stat-grid user-reports">
          {Object.entries(reports).map(([key, label]) => (
            <div className="panel stat" key={key}>
              <strong>{overview[key] ?? "--"}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <section className="user-list">
          <div className="toolbar">
            <h2>Users and Admins</h2>
            <div className="user-tools">
              <input
                className="input"
                aria-label="Search users"
                placeholder="Search users"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="btn"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                  setError("");
                  setShowForm(true);
                }}
              >
                <Plus size={17} /> Add User / Admin
              </button>
            </div>
          </div>
          <div className="user-table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </td>
                    <td>{user.role === "admin" ? "Admin" : "User"}</td>
                    <td>
                      <span className={`user-status ${user.status}`}>
                        {user.status === "active" ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <div className="user-actions">
                        <button
                          className="btn secondary"
                          title="Edit user"
                          disabled={busy}
                          onClick={() => {
                            setEditing(user);
                            setForm({ ...user, password: "" });
                            setError("");
                            setShowForm(true);
                          }}
                        >
                          <Pencil size={16} /> Edit
                        </button>
                        <button
                          className="btn secondary"
                          title={
                            user.id === self
                              ? "Your own permissions cannot be changed"
                              : "Menu permissions"
                          }
                          disabled={busy || user.id === self}
                          onClick={() => {
                            setPermissionUser(user);
                            setPermissions(user.permissions);
                            setError("");
                          }}
                        >
                          <ShieldCheck size={16} /> Permissions
                        </button>
                        <button
                          className="icon-button danger-icon"
                          title="Delete user"
                          aria-label={`Delete ${user.name}`}
                          disabled={busy || user.id === self}
                          onClick={() => {
                            if (
                              confirm(
                                `Delete ${user.name}? Their cards will also be deleted. This cannot be undone.`,
                              )
                            )
                              act(
                                () => endpoints.adminDeleteUser(user.id),
                                "User deleted.",
                              );
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && <p className="empty-qr">No users found.</p>}
          <p className="list-count">
            {filtered.length} of {users.length} users
          </p>
        </section>
        {showForm && (
          <PublicCardDialog
            label={editing ? "Edit user" : "Add user or admin"}
            onClose={close}
            className="account-dialog"
          >
            <div className="toolbar">
              <h2>{editing ? "Edit User" : "Add User / Admin"}</h2>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={close}
                disabled={busy}
              >
                <X />
              </button>
            </div>
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                act(
                  () =>
                    editing
                      ? endpoints.adminEditUser(editing.id, form)
                      : endpoints.adminCreateUser(form),
                  editing
                    ? "User updated."
                    : "User created. Share the temporary password securely.",
                );
              }}
            >
              <label className="field">
                Name
                <input
                  autoFocus
                  required
                  maxLength={160}
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="field">
                Email
                <input
                  required
                  type="email"
                  maxLength={190}
                  autoComplete="off"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              {!editing && (
                <label className="field wide">
                  Temporary password
                  <input
                    required
                    minLength={8}
                    type="password"
                    autoComplete="new-password"
                    className="input"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </label>
              )}
              <label className="field">
                Role
                <select
                  className="select"
                  disabled={editing?.id === self}
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as "user" | "admin",
                    })
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="field">
                Status
                <select
                  className="select"
                  disabled={editing?.id === self}
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "active" | "disabled",
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
              {error && (
                <p className="error wide" role="alert">
                  {error}
                </p>
              )}
              <div className="dialog-actions wide">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={close}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button className="btn" disabled={busy}>
                  {busy
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create User"}
                </button>
              </div>
            </form>
          </PublicCardDialog>
        )}
        {permissionUser && (
          <PublicCardDialog
            label="Menu permissions"
            onClose={close}
            className="account-dialog"
          >
            <div className="toolbar">
              <h2>Menu Permissions</h2>
              <button
                className="icon-button"
                aria-label="Close"
                onClick={close}
                disabled={busy}
              >
                <X />
              </button>
            </div>
            <p>{permissionUser.name}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(
                  () =>
                    endpoints.adminPermissions(permissionUser.id, permissions),
                  "Permissions saved.",
                );
              }}
            >
              <div className="permission-grid">
                {menus.map((menu) => (
                  <label key={menu.key}>
                    <input
                      type="checkbox"
                      checked={permissions.includes(menu.key)}
                      disabled={
                        busy || (menu.admin && permissionUser.role !== "admin")
                      }
                      onChange={(e) =>
                        setPermissions(
                          e.target.checked
                            ? [...permissions, menu.key]
                            : permissions.filter((k) => k !== menu.key),
                        )
                      }
                    />
                    <span>
                      {menu.label}
                      {menu.admin && <small>Admin only</small>}
                    </span>
                  </label>
                ))}
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={close}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button className="btn" disabled={busy}>
                  {busy ? "Saving..." : "Save Permissions"}
                </button>
              </div>
            </form>
          </PublicCardDialog>
        )}
      </section>
    </main>
  );
}
