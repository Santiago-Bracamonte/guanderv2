import HeroBanner from "./components/HeroBanner";
import StatsBar from "./components/StatsBar";
import LocationsFilterSection from "./components/LocationsFilterSection";
import ExclusiveOffersSection from "./components/ExclusiveOffersSection";
import SubscriptionPlans from "./components/SubscriptionPlans";
import DownloadsSection from "./components/DownloadsSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="flex flex-col w-full">
      <HeroBanner />
      <DownloadsSection />
      <StatsBar />
      <LocationsFilterSection />
      <ExclusiveOffersSection />
      <SubscriptionPlans />
      <ContactSection />
      <Footer />
    </main>
  );
}
