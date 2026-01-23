import { getProgramme, getFilmsIndex } from '@/lib/data';
import DayNavigator from '@/components/DayNavigator';

const APP_VERSION = '1.2.0';

export default async function HomePage() {
  const programme = await getProgramme();
  const filmsIndex = await getFilmsIndex();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="text-center p-md border-b border-border bg-background sticky top-0 z-10 relative">
        <h1 className="text-xl font-bold tracking-wider text-foreground">FIPADOC 2026</h1>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.65rem] text-text-muted">
          v{APP_VERSION}
        </span>
      </header>

      <DayNavigator programme={programme} filmsIndex={filmsIndex} />
    </main>
  );
}
