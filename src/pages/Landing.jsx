import { useState } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { ComparisonSection } from '../components/landing/ComparisonSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ROICalculator } from '../components/landing/ROICalculator';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { DemoSection } from '../components/landing/DemoSection';
import { DemoMenuSection } from '../components/landing/DemoMenuSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { PricingSection } from '../components/landing/PricingSection';
import { Footer } from '../components/landing/Footer';
import { ContactModal } from '../components/landing/ContactModal';
import { MobileStickyCTA } from '../components/landing/MobileStickyCTA';
import ScrollToTop from '../components/ui/ScrollToTop';

export default function Landing() {
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <ScrollToTop />
            <Navbar onOpenContactModal={() => setIsContactModalOpen(true)} />
            <main>
                <HeroSection />
                <ComparisonSection />
                <FeaturesSection />
                <ROICalculator />
                <HowItWorksSection onOpenContactModal={() => setIsContactModalOpen(true)} />
                <div id="demo">
                    <DemoSection />
                    <DemoMenuSection />
                </div>
                <TestimonialsSection />
                <PricingSection />
            </main>
            <Footer onOpenContactModal={() => setIsContactModalOpen(true)} />
            <ContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
            />
            <MobileStickyCTA />
        </div>
    );
}
