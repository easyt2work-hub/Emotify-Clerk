import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading clinical data...' }) => (
  <div style={{ display: 'flex', minHeight: '350px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', color: 'var(--text-secondary)' }}>
    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{message}</span>
  </div>
);

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction, icon }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.4)' }}>
    {icon && <div style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>{icon}</div>}
    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{title}</h3>
    {description && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 16px 0', maxWidth: '400px' }}>{description}</p>}
    {actionLabel && onAction && (
      <button className="btn btn-primary" onClick={onAction} style={{ fontSize: '0.85rem' }}>
        {actionLabel}
      </button>
    )}
  </div>
);

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  isDanger = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel hud-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '28px', background: '#ffffff', borderRadius: '18px' }}>
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 8px 0', color: isDanger ? 'var(--danger)' : 'var(--text-primary)' }}>{title}</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};
