import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import SampleBrief from "@/components/SampleBrief";
import WhyBriefcast from "@/components/WhyBriefcast";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SampleBrief />
        <WhyBriefcast />
        <HowItWorks />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
