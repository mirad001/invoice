import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Key, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

function PinKeypad() {
  const { loginStaff } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (!loginStaff(next)) {
          setError(true);
          setPin('');
        }
      }, 120);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-14 h-14 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xl font-bold mb-3">S</div>
      <p className="text-white font-semibold mb-1">Staff</p>
      <p className="text-slate-400 text-sm mb-6">Enter your 4-digit PIN</p>

      <div className="flex gap-4 mb-4">
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            animate={{ scale: pin.length > i ? 1.2 : 1 }}
            className={`w-3.5 h-3.5 rounded-full transition-colors ${
              error ? 'bg-red-500' : pin.length > i ? 'bg-accent' : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mb-4">
          Incorrect PIN — try again
        </motion.p>
      )}

      <div className="grid grid-cols-3 gap-3 w-full max-w-[220px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
          <button
            key={d}
            onClick={() => handleDigit(String(d))}
            className="h-14 rounded-xl bg-brand-light hover:bg-white/10 active:scale-95 text-white text-xl font-semibold transition-all border border-white/10"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          className="h-14 rounded-xl bg-brand-light hover:bg-white/10 active:scale-95 text-white text-xl font-semibold transition-all border border-white/10"
        >
          0
        </button>
        <button
          onClick={() => setPin(p => p.slice(0, -1))}
          className="h-14 rounded-xl bg-brand hover:bg-brand-light active:scale-95 text-slate-400 text-xl transition-all border border-white/5"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  const { loginAdmin, resetAdminPassword } = useApp();

  const [tab, setTab]   = useState('admin'); // 'admin' | 'staff'
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'reset'

  // Admin login fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loginErr, setLoginErr] = useState('');

  // Forgot password
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryErr, setRecoveryErr]   = useState('');

  // Reset password
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [resetErr, setResetErr]     = useState('');
  const [resetOk, setResetOk]       = useState(false);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (!loginAdmin(email, password)) {
      setLoginErr('Invalid email or password.');
    }
  };

  const handleVerifyRecovery = (e) => {
    e.preventDefault();
    if (!recoveryCode.trim()) {
      setRecoveryErr('Please enter your recovery code.');
      return;
    }
    setRecoveryErr('');
    setMode('reset');
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setResetErr('');
    if (!newPwd || newPwd.length < 6) {
      setResetErr('Password must be at least 6 characters.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setResetErr('Passwords do not match.');
      return;
    }
    if (!resetAdminPassword(recoveryCode.trim(), newPwd)) {
      setResetErr('Invalid recovery code. Please go back and try again.');
      return;
    }
    setResetOk(true);
    setTimeout(() => {
      setMode('login');
      setResetOk(false);
      setRecoveryCode('');
      setNewPwd('');
      setConfirmPwd('');
    }, 2000);
  };

  const switchTab = (t) => {
    setTab(t);
    setLoginErr('');
    setMode('login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand p-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="text-accent text-4xl font-black tracking-tight mb-1">BOND</div>
        <div className="text-slate-400 text-sm tracking-widest uppercase">Invoice Dashboard</div>
      </motion.div>

      <div className="w-full max-w-sm">
        {/* Tab switcher — hidden during forgot/reset flow */}
        {mode === 'login' && (
          <div className="flex bg-brand-light rounded-xl p-1 mb-6 border border-white/10">
            <button
              onClick={() => switchTab('admin')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'admin' ? 'bg-accent text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchTab('staff')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'staff' ? 'bg-accent text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Staff
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Admin login ── */}
          {tab === 'admin' && mode === 'login' && (
            <motion.form
              key="admin-login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleAdminLogin}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setLoginErr(''); }}
                    placeholder="admin@bondcleaning.com.au"
                    autoComplete="email"
                    className="w-full pl-9 pr-4 py-3 bg-brand-light border border-white/10 hover:border-white/20 focus:border-accent outline-none rounded-xl text-white text-sm placeholder-slate-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLoginErr(''); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-3 bg-brand-light border border-white/10 hover:border-white/20 focus:border-accent outline-none rounded-xl text-white text-sm placeholder-slate-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {loginErr && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
                  {loginErr}
                </motion.p>
              )}

              <button
                type="submit"
                className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl text-sm transition-all"
              >
                Sign In
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setLoginErr(''); }}
                  className="text-xs text-slate-500 hover:text-accent transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </motion.form>
          )}

          {/* ── Staff PIN ── */}
          {tab === 'staff' && mode === 'login' && (
            <motion.div
              key="staff-login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PinKeypad />
            </motion.div>
          )}

          {/* ── Forgot password — enter recovery code ── */}
          {mode === 'forgot' && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleVerifyRecovery}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <p className="text-white font-semibold text-sm">Forgot Password</p>
                  <p className="text-slate-500 text-xs">Enter your recovery code to continue</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Recovery Code</label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={e => { setRecoveryCode(e.target.value); setRecoveryErr(''); }}
                    placeholder="BOND-RESET-XXXX"
                    className="w-full pl-9 pr-4 py-3 bg-brand-light border border-white/10 hover:border-white/20 focus:border-accent outline-none rounded-xl text-white text-sm font-mono placeholder-slate-600 tracking-wider transition-all"
                  />
                </div>
              </div>

              {recoveryErr && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
                  {recoveryErr}
                </motion.p>
              )}

              <button
                type="submit"
                className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl text-sm transition-all"
              >
                Continue →
              </button>
            </motion.form>
          )}

          {/* ── Reset password ── */}
          {mode === 'reset' && (
            <motion.form
              key="reset"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleResetPassword}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <p className="text-white font-semibold text-sm">Reset Password</p>
                  <p className="text-slate-500 text-xs">Choose a new password for your account</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => { setNewPwd(e.target.value); setResetErr(''); }}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-3 bg-brand-light border border-white/10 hover:border-white/20 focus:border-accent outline-none rounded-xl text-white text-sm placeholder-slate-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={e => { setConfirmPwd(e.target.value); setResetErr(''); }}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-4 py-3 bg-brand-light border border-white/10 hover:border-white/20 focus:border-accent outline-none rounded-xl text-white text-sm placeholder-slate-600 transition-all"
                  />
                </div>
              </div>

              {resetErr && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
                  {resetErr}
                </motion.p>
              )}
              {resetOk && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 text-sm">
                  Password reset successfully! Redirecting…
                </motion.p>
              )}

              <button
                type="submit"
                disabled={resetOk}
                className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-60"
              >
                Reset Password
              </button>
            </motion.form>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
