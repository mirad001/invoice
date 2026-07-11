import { motion, AnimatePresence } from 'framer-motion';

export default function Stamp({ status }) {
  const isPaid = status === 'paid';

  return (
    <div className="stamp-wrap">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, mass: 0.8 }}
          style={{ rotate: isPaid ? 7 : -9 }}
          className={`stamp-box ${isPaid ? 'stamp-paid' : 'stamp-pending'}`}
        >
          {isPaid ? 'PAID' : 'UNPAID'}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
