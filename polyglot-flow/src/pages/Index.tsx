import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { AIExplainerSection } from "@/components/landing/AIExplainerSection";
import { BentoGridSection } from "@/components/landing/BentoGridSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { FloatingCTA } from "@/components/landing/FloatingCTA";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <HowItWorksSection />
      <AIExplainerSection />
      <BentoGridSection />
      <SocialProofSection />
      <FooterSection />
      <FloatingCTA />
    </main>
  );
};

export default Index;
