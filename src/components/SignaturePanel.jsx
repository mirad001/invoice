import { motion } from 'framer-motion';
import { PenLine, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../utils/invoiceUtils';

export default function SignaturePanel({ signatures, onSign, compact = false }) {
  const { currentUser } = useApp();
  const alreadySigned = signatures.some(s => s.userId === currentUser?.id);
  const canSign = currentUser && !alreadySigned && signatures.length < 5;

  return (
    <div className={compact ? '' : 'mt-8 pt-6 border-t border-slate-200'}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Authorised Signatures
        </h3>
        {canSign && (
          <button
            onClick={onSign}
            className="no-print flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-dark transition-colors px-3 py-1.5 rounded-lg border border-accent/30 hover:border-accent hover:bg-accent/5"
          >
            <PenLine size={13} />
            Accept &amp; Sign
          </button>
        )}
        {alreadySigned && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 size={13} />
            Signed
          </span>
        )}
      </div>

      {signatures.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No signatures yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {signatures.map((sig, i) => (
            <motion.div
              key={sig.userId + sig.timestamp}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-slate-200 rounded-lg p-3"
            >
              <div className="font-semibold text-sm text-slate-700 mb-0.5">{sig.userName}</div>
              <div className="text-xs text-slate-400">{formatDateTime(sig.timestamp)}</div>
              <div className="mt-2 h-px bg-slate-300 w-full" />
              <div className="mt-1 text-[10px] text-slate-400 italic">Authorised</div>
            </motion.div>
          ))}
          {Array.from({ length: Math.max(0, 5 - signatures.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="border border-dashed border-slate-200 rounded-lg p-3 flex items-center justify-center"
            >
              <span className="text-xs text-slate-300">Signature {signatures.length + i + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
