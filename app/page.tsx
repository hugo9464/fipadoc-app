import { getProgramme, getFilmsIndex } from '@/lib/data';
import DayNavigator from '@/components/DayNavigator';

export default function HomePage() {
  const programme = getProgramme();
  const filmsIndex = getFilmsIndex();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="text-center p-md border-b border-border bg-background sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-wider text-foreground">FIPADOC 2026</h1>
      </header>

      <DayNavigator programme={programme} filmsIndex={filmsIndex} />
    </main>
  );
}
