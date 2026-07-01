import { useState } from 'react';
import { Eye, EyeOff, Save, Key, Mail, Lock, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ icon: Icon, type, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
      <input
        type={isPassword && show ? 'text' : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full py-2.5 rounded-lg border border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all ${Icon ? 'pl-9' : 'pl-4'} ${isPassword ? 'pr-10' : 'pr-4'}`}
      />
      {isPassword && (
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
  );
}

export default function AccountSettings({ setView }) {
  const { adminEmail, verifyAdminPassword, updateAdminCreds } = useApp();

  // ── Credentials form ──────────────────────────────────────────────────────
  const [newEmail, setNewEmail]       = useState(adminEmail);
  const [curPwd, setCurPwd]           = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [credsMsg, setCredsMsg]       = useState('');
  const [credsErr, setCredsErr]       = useState('');

  const handleSaveCreds = (e) => {
    e.preventDefault();
    setCredsErr('');
    setCredsMsg('');
    if (!verifyAdminPassword(curPwd)) {
      setCredsErr('Current password is incorrect.');
      return;
    }
    if (!newEmail.trim()) {
      setCredsErr('Email cannot be empty.');
      return;
    }
    const updates = { email: newEmail.trim() };
    if (newPwd) {
      if (newPwd.length < 6) {
        setCredsErr('New password must be at least 6 characters.');
        return;
      }
      if (newPwd !== confirmPwd) {
        setCredsErr('Passwords do not match.');
        return;
      }
      updates.password = newPwd;
    }
    updateAdminCreds(updates);
    setCredsMsg('Credentials updated successfully.');
    setCurPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setTimeout(() => setCredsMsg(''), 4000);
  };

  // ── Recovery code form ────────────────────────────────────────────────────
  const [newCode, setNewCode]   = useState('');
  const [codePwd, setCodePwd]   = useState('');
  const [codeMsg, setCodeMsg]   = useState('');
  const [codeErr, setCodeErr]   = useState('');

  const handleSaveCode = (e) => {
    e.preventDefault();
    setCodeErr('');
    setCodeMsg('');
    if (!verifyAdminPassword(codePwd)) {
      setCodeErr('Incorrect password.');
      return;
    }
    if (!newCode.trim()) {
      setCodeErr('Recovery code cannot be empty.');
      return;
    }
    updateAdminCreds({ recoveryCode: newCode.trim() });
    setCodeMsg('Recovery code updated.');
    setNewCode('');
    setCodePwd('');
    setTimeout(() => setCodeMsg(''), 4000);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setView({ type: 'dashboard' })}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Account Settings</h1>
          <p className="text-sm text-slate-500">{adminEmail}</p>
        </div>
      </div>

      {/* ── Login credentials ── */}
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSaveCreds}
        className="bg-white rounded-2xl shadow-invoice p-6 mb-4 space-y-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <Mail size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">Login Credentials</h2>
        </div>

        <Field label="Email address">
          <Input icon={Mail} type="email" value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="admin@bondcleaning.com.au"
            autoComplete="email" />
        </Field>

        <Field label="Current password">
          <Input icon={Lock} type="password" value={curPwd}
            onChange={e => setCurPwd(e.target.value)}
            placeholder="Enter current password to save changes"
            autoComplete="current-password" />
        </Field>

        <Field label={<>New password <span className="normal-case font-normal text-slate-400">(leave blank to keep current)</span></>}>
          <Input icon={Lock} type="password" value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            placeholder="Min. 6 characters"
            autoComplete="new-password" />
        </Field>

        {newPwd && (
          <Field label="Confirm new password">
            <Input icon={Lock} type="password" value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password" />
          </Field>
        )}

        {credsErr && <p className="text-sm text-red-500">{credsErr}</p>}
        {credsMsg && <p className="text-sm text-emerald-600">{credsMsg}</p>}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
        >
          <Save size={14} /> Save Credentials
        </button>
      </motion.form>

      {/* ── Recovery code ── */}
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        onSubmit={handleSaveCode}
        className="bg-white rounded-2xl shadow-invoice p-6 space-y-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <Key size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">Recovery Code</h2>
        </div>
        <p className="text-xs text-slate-400 -mt-3">
          This code lets you reset your password if you ever forget it. Store it somewhere safe.
        </p>

        <Field label="New recovery code">
          <Input icon={Key} type="password" value={newCode}
            onChange={e => setNewCode(e.target.value)}
            placeholder="e.g. BOND-RESET-2024"
            autoComplete="off" />
        </Field>

        <Field label="Confirm with your password">
          <Input icon={Lock} type="password" value={codePwd}
            onChange={e => setCodePwd(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password" />
        </Field>

        {codeErr && <p className="text-sm text-red-500">{codeErr}</p>}
        {codeMsg && <p className="text-sm text-emerald-600">{codeMsg}</p>}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
        >
          <Save size={14} /> Update Recovery Code
        </button>
      </motion.form>
    </div>
  );
}
