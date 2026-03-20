import HeroBanner from "./components/HeroBanner";
import StatsBar from "./components/StatsBar";
import StoresList from "./components/StoresList";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="flex flex-col w-full">
      <HeroBanner />
      <StatsBar />
      <StoresList />
      <Footer />
    </main>
  );
}
