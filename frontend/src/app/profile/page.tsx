"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { endpoints, uploadImage } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  profileImageUrl?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User>();
  const [name, setName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    endpoints.me()
      .then((res) => {
        setUser(res.user);
        setName(res.user.name);
        setProfileImageUrl(res.user.profileImageUrl || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Profile failed to load"));
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      const res = await endpoints.updateMe({ name, profileImageUrl });
      setUser(res.user);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile update failed");
    }
  };

  const uploadProfileImage = async (file?: File) => {
    if (!file) return;
    try {
      setError("");
      setMessage("");
      const uploaded = await uploadImage(file);
      setProfileImageUrl(uploaded.publicUrl);
      setMessage("Profile photo uploaded. Click Save profile to keep it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile photo upload failed");
    }
  };

  return (
    <main className="dashboard-layout">
      <AppNav/>
      <section className="main">
        <div className="toolbar">
          <div>
            <h1>Update Profile</h1>
            <p>Manage your account details and profile photo.</p>
          </div>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {message ? <div className="success">{message}</div> : null}

        <div className="profile-grid single">
          <form className="panel" onSubmit={saveProfile}>
            <h2>Update Profile</h2>
            <div className="profile-photo-row">
              {profileImageUrl ? <img src={profileImageUrl} alt=""/> : <span>{(name || "U").slice(0, 1).toUpperCase()}</span>}
              <label className="btn secondary">Upload photo<input type="file" accept="image/*" hidden onChange={(e)=>uploadProfileImage(e.target.files?.[0])}/></label>
            </div>
            <div className="form-grid">
              <label className="field">Name<input className="input" value={name} onChange={(e)=>setName(e.target.value)}/></label>
              <label className="field">Email<input className="input" value={user?.email || ""} disabled/></label>
              <label className="field">Role<input className="input" value={user?.role || ""} disabled/></label>
              <label className="field">Status<input className="input" value={user?.status || ""} disabled/></label>
            </div>
            <button className="btn" style={{marginTop:16}}>Save profile</button>
          </form>
        </div>
      </section>
    </main>
  );
}
