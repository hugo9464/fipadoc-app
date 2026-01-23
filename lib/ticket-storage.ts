/**
 * IndexedDB Ticket Storage - Client-Side Only
 *
 * This module provides local persistence for user's PDF ticket using IndexedDB.
 * The ticket is stored locally in the browser and persists across sessions.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TicketDB extends DBSchema {
  ticket: {
    key: string;
    value: {
      id: string;
      data: ArrayBuffer;
      filename: string;
      mimeType: string;
      uploadedAt: number;
    };
  };
}

const DB_NAME = 'fipadoc-ticket';
const DB_VERSION = 1;
const TICKET_KEY = 'user-ticket';

let dbPromise: Promise<IDBPDatabase<TicketDB>> | null = null;

function isIndexedDBAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.indexedDB !== 'undefined'
  );
}

function getDB(): Promise<IDBPDatabase<TicketDB>> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(
      new Error('IndexedDB is not available in this environment')
    );
  }

  if (!dbPromise) {
    dbPromise = openDB<TicketDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('ticket')) {
          db.createObjectStore('ticket', { keyPath: 'id' });
        }
      },
    });
  }

  return dbPromise;
}

export interface StoredTicket {
  data: ArrayBuffer;
  filename: string;
  mimeType: string;
  uploadedAt: number;
}

/**
 * Save a PDF ticket to IndexedDB
 */
export async function saveTicket(
  data: ArrayBuffer,
  filename: string,
  mimeType: string = 'application/pdf'
): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return;
  }

  const db = await getDB();
  await db.put('ticket', {
    id: TICKET_KEY,
    data,
    filename,
    mimeType,
    uploadedAt: Date.now(),
  });
}

/**
 * Get the stored ticket
 */
export async function getTicket(): Promise<StoredTicket | null> {
  if (!isIndexedDBAvailable()) {
    return null;
  }

  const db = await getDB();
  const ticket = await db.get('ticket', TICKET_KEY);

  if (!ticket) {
    return null;
  }

  return {
    data: ticket.data,
    filename: ticket.filename,
    mimeType: ticket.mimeType,
    uploadedAt: ticket.uploadedAt,
  };
}

/**
 * Check if a ticket is stored
 */
export async function hasTicket(): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    return false;
  }

  const db = await getDB();
  const ticket = await db.get('ticket', TICKET_KEY);
  return !!ticket;
}

/**
 * Delete the stored ticket
 */
export async function deleteTicket(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return;
  }

  const db = await getDB();
  await db.delete('ticket', TICKET_KEY);
}

/**
 * Get ticket as a Blob URL for viewing/downloading
 */
export async function getTicketBlobUrl(): Promise<string | null> {
  const ticket = await getTicket();
  if (!ticket) {
    return null;
  }

  const blob = new Blob([ticket.data], { type: ticket.mimeType });
  return URL.createObjectURL(blob);
}
