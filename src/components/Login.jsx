import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { USERS } from '../config/users';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => checkPin(next), 120);
    }
  };

  const checkPin = (entered) => {
    if (entered === selectedUser.pin) {
      login(selectedUser);
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPin('');
    setError(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand p-4">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="text-accent text-4xl font-black tracking-tight mb-1">BOND</div>
        <div className="text-slate-400 text-sm tracking-widest uppercase">Invoice Dashboard</div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selectedUser ? (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-sm"
          >
            <p className="text-slate-400 text-center text-sm mb-6">Select your name to log in</p>
            <div className="grid grid-cols-1 gap-3">
              {USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full py-4 px-6 rounded-xl bg-brand-light hover:bg-white/10 border border-white/10 hover:border-accent/50 text-white font-semibold text-left transition-all duration-150 flex items-center gap-4"
                >
                  <span className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {user.name.charAt(0)}
                  </span>
                  <span>{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="ml-auto text-xs text-accent/70 font-medium">Admin</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-xs flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xl font-bold mb-3">
              {selectedUser.name.charAt(0)}
            </div>
            <p className="text-white font-semibold mb-1">{selectedUser.name}</p>
            <p className="text-slate-400 text-sm mb-6">Enter your 4-digit PIN</p>

            {/* PIN dots */}
            <div className="flex gap-4 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: pin.length > i ? 1.2 : 1 }}
                  className={`w-3.5 h-3.5 rounded-full transition-colors duration-150 ${
                    error
                      ? 'bg-red-500'
                      : pin.length > i
                      ? 'bg-accent'
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm mb-4"
              >
                Incorrect PIN — try again
              </motion.p>
            )}

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-3 w-full mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(String(d))}
                  className="h-14 rounded-xl bg-brand-light hover:bg-white/10 active:scale-95 text-white text-xl font-semibold transition-all border border-white/10"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={handleBack}
                className="h-14 rounded-xl bg-brand hover:bg-brand-light active:scale-95 text-slate-400 text-sm font-medium transition-all border border-white/5"
              >
                Back
              </button>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
