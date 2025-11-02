

import React from 'react';
import { CloseIcon } from './Icons';
import { vibrate } from '../utils/haptics';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    vibrate();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="liquid-glass p-6 rounded-2xl shadow-xl w-full max-w-md mx-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={handleClose} className="interactive-press text-text-secondary hover:text-text-primary p-1 rounded-full">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;