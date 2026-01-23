# CLAUDE.md

Instructions for Claude Code working on this codebase.

## Project Overview

FIPADOC PWA - A Progressive Web App for the FIPADOC documentary film festival program. Built with Next.js 15, React 19, and Tailwind CSS v4.

## Version Management

**Current version: 1.5.0** (defined in `app/page.tsx` as `APP_VERSION`)

When making significant changes, increment the version:
- Patch (1.1.x): Bug fixes, minor tweaks
- Minor (1.x.0): New features, improvements
- Major (x.0.0): Breaking changes, major rewrites

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run test      # Run tests
npm run type-check # TypeScript check
```

## Architecture

- `/app` - Next.js App Router pages and layouts
- `/components` - React components (all use Tailwind CSS)
- `/lib` - Utilities, types, and data access
- `/public` - Static assets and PWA manifest

## Styling

Uses Tailwind CSS v4 with CSS-based configuration in `globals.css`:
- Custom colors: background, foreground, text-secondary, text-muted, surface, border, theme, favorite, accent
- Dark theme colors: background-dark, foreground-dark, text-secondary-dark, surface-dark, border-dark
- Custom spacing: xs, sm, md, lg, xl
- Font: Oswald (via next/font/google) for headings, using `font-heading` utility class
- Dark theme support via `data-theme="dark"` attribute (used in FilmDetail modal)
