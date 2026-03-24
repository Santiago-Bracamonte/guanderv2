import HeroBanner from "./components/HeroBanner";
import StatsBar from "./components/StatsBar";
import LocationsFilterSection from "./components/LocationsFilterSection";
import ExclusiveOffersSection from "./components/ExclusiveOffersSection";

export default function Home() {
  return (
    <main className="flex flex-col w-full">
      <HeroBanner />
      <StatsBar />
      <LocationsFilterSection />
      <ExclusiveOffersSection />
    </main>
  );
}
