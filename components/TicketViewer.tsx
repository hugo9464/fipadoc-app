'use client';

import { useState, useEffect, useRef } from 'react';
import { getTicket, saveTicket, deleteTicket, getTicketBlobUrl, StoredTicket } from '@/lib/ticket-storage';

interface TicketViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TicketViewer({ isOpen, onClose }: TicketViewerProps) {
  const [ticket, setTicket] = useState<StoredTicket | null>(null);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTicket();
    }
    return () => {
      if (ticketUrl) {
        URL.revokeObjectURL(ticketUrl);
      }
    };
  }, [isOpen]);

  const loadTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedTicket = await getTicket();
      setTicket(storedTicket);
      if (storedTicket) {
        const url = await getTicketBlobUrl();
        setTicketUrl(url);
      }
    } catch {
      setError('Erreur lors du chargement du billet');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Veuillez selectionner un fichier PDF');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      await saveTicket(arrayBuffer, file.name, file.type);
      await loadTicket();
    } catch {
      setError('Erreur lors de l\'enregistrement du billet');
    } finally {
      setUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer le billet ?')) return;

    try {
      await deleteTicket();
      if (ticketUrl) {
        URL.revokeObjectURL(ticketUrl);
      }
      setTicket(null);
      setTicketUrl(null);
    } catch {
      setError('Erreur lors de la suppression du billet');
    }
  };

  const handleDownload = () => {
    if (!ticketUrl || !ticket) return;

    const link = document.createElement('a');
    link.href = ticketUrl;
    link.download = ticket.filename;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" data-theme="dark">
      {/* Header */}
      <header className="flex items-center justify-between p-md bg-surface-dark border-b border-border-dark">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 border-none bg-transparent text-foreground-dark cursor-pointer rounded-full transition-colors duration-150 hover:bg-border-dark"
          aria-label="Fermer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="font-heading text-lg font-semibold text-foreground-dark uppercase tracking-wide">
          Mon Billet
        </h2>

        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-secondary-dark">Chargement...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-lg">
            <p className="text-red-400 mb-md">{error}</p>
            <button
              onClick={loadTicket}
              className="px-lg py-sm bg-surface-dark border border-border-dark rounded-md text-foreground-dark cursor-pointer hover:bg-border-dark transition-colors"
            >
              Reessayer
            </button>
          </div>
        ) : ticket && ticketUrl ? (
          <div className="flex-1 flex flex-col">
            {/* PDF Viewer */}
            <div className="flex-1 bg-black">
              <iframe
                src={ticketUrl}
                className="w-full h-full border-none"
                title="Billet PDF"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between p-md bg-surface-dark border-t border-border-dark gap-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground-dark truncate">{ticket.filename}</p>
                <p className="text-xs text-text-muted-dark">
                  Ajoute le {new Date(ticket.uploadedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-sm">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-xs px-md py-sm bg-theme text-white border-none rounded-md cursor-pointer hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Telecharger
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center w-10 h-10 bg-transparent border border-border-dark rounded-md text-text-muted-dark cursor-pointer hover:bg-red-500/20 hover:border-red-500 hover:text-red-400 transition-colors"
                  aria-label="Supprimer le billet"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Replace ticket option */}
            <div className="p-md bg-surface-dark border-t border-border-dark">
              <label className="flex items-center justify-center gap-sm px-md py-sm bg-transparent border border-dashed border-border-dark rounded-md text-text-muted-dark cursor-pointer hover:bg-border-dark/50 hover:border-text-muted-dark transition-colors text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Remplacer le billet
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-xl">
            <div className="flex flex-col items-center text-center max-w-sm">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted-dark mb-lg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>

              <h3 className="font-heading text-lg font-semibold text-foreground-dark uppercase mb-sm">
                Aucun billet enregistre
              </h3>
              <p className="text-sm text-text-muted-dark mb-lg">
                Uploadez votre billet PDF pour y acceder rapidement hors ligne
              </p>

              <label className={`flex items-center gap-sm px-lg py-md bg-theme text-white border-none rounded-md cursor-pointer hover:opacity-90 transition-opacity text-sm font-medium ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploading ? (
                  <>Chargement...</>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Ajouter mon billet PDF
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              <div className="mt-xl pt-lg border-t border-border-dark w-full">
                <p className="text-xs text-text-muted-dark mb-sm">
                  Vous n'avez pas encore de billet ?
                </p>
                <a
                  href="https://site-fipadoc.festicine.fr/fr/account/ticket"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-xs text-theme hover:underline text-sm font-medium"
                >
                  Acceder a mon compte FIPADOC
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
