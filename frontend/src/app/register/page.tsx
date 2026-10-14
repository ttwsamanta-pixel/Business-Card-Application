import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="shell">
      <nav className="nav"><Link href="/" className="brand"><img src="/TTW-Logo.png" alt="" className="brand-logo"/>TTW card studio</Link></nav>
      <div className="auth-wrap">
        <section className="auth-card">
          <h1>Private Access</h1>
          <p>This workspace is invite-only. Ask the super admin to create an account for you.</p>
          <Link className="btn" style={{width:"100%", marginTop:12}} href="/login">Go to login</Link>
        </section>
      </div>
    </main>
  );
}
