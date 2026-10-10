import Link from "next/link";

export default function NotFound() {
  return <main className="auth-wrap"><div className="auth-card"><h1>Page not found</h1><p>The page you requested is not available.</p><Link className="btn" href="/">Go home</Link></div></main>;
}
