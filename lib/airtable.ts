/**
 * Airtable Client - Server-Side Only
 *
 * SECURITY: This module must ONLY be used on the server-side
 * (API routes, Server Components, Route Handlers).
 * Never import this file in client components as it would expose API keys.
 *
 * Usage in Server Components:
 *   import { filmsTable, screeningsTable, roomsTable } from '@/lib/airtable';
 *
 * Usage in API Routes:
 *   import { base } from '@/lib/airtable';
 */

import Airtable from 'airtable';

// Validate required environment variables at module load
if (!process.env.AIRTABLE_API_KEY) {
  throw new Error(
    'AIRTABLE_API_KEY environment variable is required. ' +
      'Get your API key from: https://airtable.com/create/tokens'
  );
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error(
    'AIRTABLE_BASE_ID environment variable is required. ' +
      'Find your Base ID in the Airtable URL (starts with "app")'
  );
}

// Configure Airtable with the API key
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY,
});

// Create the base instance
export const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

/**
 * Table Accessors
 *
 * These provide typed access to specific tables in the Airtable base.
 * Expand this section as new tables are added to the schema.
 */

// Films table - stores documentary film information
export const filmsTable = base('Films');

// Screenings table - stores screening schedules
export const screeningsTable = base('Screenings');

// Rooms table - stores venue/room information
export const roomsTable = base('Rooms');

/**
 * Type definitions for Airtable records
 *
 * These types will be expanded as the Airtable schema is finalized.
 * For now, they provide basic structure hints.
 */
export interface FilmRecord {
  id: string;
  fields: {
    Name?: string;
    Description?: string;
    Duration?: number;
    Director?: string;
    Country?: string;
    Year?: number;
    [key: string]: unknown;
  };
}

export interface ScreeningRecord {
  id: string;
  fields: {
    Film?: string[];
    Room?: string[];
    StartTime?: string;
    EndTime?: string;
    [key: string]: unknown;
  };
}

export interface RoomRecord {
  id: string;
  fields: {
    Name?: string;
    Capacity?: number;
    Location?: string;
    [key: string]: unknown;
  };
}
