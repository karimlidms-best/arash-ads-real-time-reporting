'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Daxil olmaq mümkün olmadı');
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <style jsx global>{`
        .dotgrid {
          background-image: radial-gradient(rgba(0,45,87,.06) 1px, transparent 1px);
          background-size: 22px 22px;
        }
        .navy { color: #002D57; }
        .btn-primary {
          background: #002D57;
          transition: all .15s;
        }
        .btn-primary:hover:not(:disabled) {
          background: #013b70;
          transform: translateY(-1px);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        input.field:focus {
          outline: none;
          border-color: #002D57;
          box-shadow: 0 0 0 3px rgba(0,45,87,.12);
        }
      `}</style>

      {/* LEFT: brand panel */}
      <div className="relative bg-white dotgrid hidden lg:flex flex-col items-center justify-center p-12 border-r border-slate-100 overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center max-w-xl">
          <img src="/arash-full-logo.png" alt="Arash Company" className="h-24 w-auto mb-10" />
          <p className="navy text-xl font-semibold leading-snug tracking-tight whitespace-nowrap">
            Bütün rəqəmsal hesabat və rəqəmsal satışlar bir paneldə
          </p>
          <div className="flex flex-col gap-2.5 mt-10 text-[13px]" style={{ color: 'rgba(0,45,87,.8)' }}>
            <div className="flex items-center gap-2.5 justify-center">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#002D57' }}></span>
              4 şöbə
            </div>
            <div className="flex items-center gap-2.5 justify-center">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#002D57' }}></span>
              1 podcast
            </div>
            <div className="flex items-center gap-2.5 justify-center">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#002D57' }}></span>
              1 klinika
            </div>
            <div className="flex items-center gap-2.5 justify-center">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#002D57' }}></span>
              1 akademiya
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center text-xs" style={{ color: 'rgba(0,45,87,.4)' }}>
          &copy; 2026 Arash Company · Daxili istifadə üçün
        </div>
      </div>

      {/* RIGHT: form */}
      <div className="flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <img src="/arash-full-logo.png" alt="Arash Company" className="h-16 w-auto" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Daxil ol</h1>
          <p className="text-sm text-slate-500 mt-1.5 mb-8 leading-relaxed">
            Zəhmət olmasa, sizlə bölüşdürülmüş "login" və "parol"-u daxil edin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Login</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ad@arash-company.az"
                  className="field w-full text-sm border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Parol</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field w-full text-sm border border-slate-300 rounded-lg pl-10 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 bg-white"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</div>
            )}

            <button type="submit" disabled={loading}
                    className="btn-primary w-full text-white text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Yoxlanılır…</span>
                </>
              ) : (
                <span>Daxil ol</span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8 lg:hidden">
            &copy; 2026 Arash Company · Daxili istifadə üçün
          </p>
        </div>
      </div>
    </div>
  );
}
