import { useState } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { DemoMenuSection } from '../components/landing/DemoMenuSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { PricingSection } from '../components/landing/PricingSection';
import { Footer } from '../components/landing/Footer';
import { ContactModal } from '../components/landing/ContactModal';
import ScrollToTop from '../components/ui/ScrollToTop';

export default function Landing() {
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <ScrollToTop />
            <Navbar />
            <main>
                <HeroSection />
                <FeaturesSection />
                <HowItWorksSection onOpenContactModal={() => setIsContactModalOpen(true)} />
                <DemoMenuSection />
                <TestimonialsSection />
                <PricingSection />
            </main>
            <Footer onOpenContactModal={() => setIsContactModalOpen(true)} />
            <ContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
            />
        </div>
    );
}
