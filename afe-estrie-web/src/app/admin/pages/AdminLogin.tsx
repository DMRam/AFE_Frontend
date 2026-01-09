import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../services/firebase";

export function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      nav("/admin", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Login error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={login} className="w-full max-w-sm rounded-2xl border p-6 space-y-4">
        <h1 className="text-xl font-semibold">Admin Login</h1>

        <input className="w-full border rounded-lg p-2"
          placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <input className="w-full border rounded-lg p-2"
          placeholder="Password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button className="w-full rounded-lg bg-black text-white py-2">
          Sign in
        </button>
      </form>
    </div>
  );
}
