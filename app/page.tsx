import HomeAudioVisualizer from "@/components/home/HomeAudioVisualizer";
import HomeFeatureGrid from "@/components/home/HomeFeatureGrid";
import HomeFooter from "@/components/home/HomeFooter";
import HomeHeader from "@/components/home/HomeHeader";
import HomeHero from "@/components/home/HomeHero";

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <HomeHeader />
      <main className="relative flex min-h-screen flex-col items-center pt-20">
        <HomeHero />
        <HomeFeatureGrid />
      </main>
      <HomeFooter />
      <HomeAudioVisualizer />
    </div>
  );
}
