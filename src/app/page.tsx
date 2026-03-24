import HeroBanner from "./components/HeroBanner";
import StatsBar from "./components/StatsBar";
import StoresList from "./components/StoresList";
import SubscriptionPlans from "./components/SubscriptionPlans";
import DownloadsSection from "./components/DownloadsSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="flex flex-col w-full">
      <HeroBanner />
      <DownloadsSection />
      <StatsBar />
      
      <SubscriptionPlans />
      <Footer />
    </main>
  );
}
