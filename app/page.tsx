import { getProgramme, getFilmsIndex } from '@/lib/data';
import DayNavigator from '@/components/DayNavigator';
import Header from '@/components/Header';

const APP_VERSION = '1.6.2';

export default async function HomePage() {
  const programme = await getProgramme();
  const filmsIndex = await getFilmsIndex();

  return (
    <main className="min-h-screen flex flex-col">
      <Header version={APP_VERSION} />
      <DayNavigator programme={programme} filmsIndex={filmsIndex} />
    </main>
  );
}
