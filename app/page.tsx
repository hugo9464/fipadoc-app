import { getProgramme, getFilmsIndex } from '@/lib/data';
import DayNavigator from '@/components/DayNavigator';

export default function HomePage() {
  const programme = getProgramme();
  const filmsIndex = getFilmsIndex();

  return (
    <main className="schedule-container">
      <header className="app-header">
        <h1 className="app-title">FIPADOC 2026</h1>
      </header>

      <DayNavigator programme={programme} filmsIndex={filmsIndex} />
    </main>
  );
}
