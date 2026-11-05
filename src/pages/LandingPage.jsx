import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import InteractiveShowcase from '../components/InteractiveShowcase'
import FeaturesSection from '../components/FeaturesSection'
import BenefitsSection from '../components/BenefitsSection'
import PricingSection from '../components/PricingSection'
import FAQSection from '../components/FAQSection'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-blue-600 selection:text-white">
      {/* Sticky Top Navigation Bar */}
      <Navbar onGetStarted={onGetStarted} />

      {/* Main Page Flow with Smooth Transitions */}
      <main>
        {/* Hero Section with Interactive Terminal & Floating Cards */}
        <Hero onGetStarted={onGetStarted} />

        {/* Interactive Feature Showcase with Live Tab Switcher */}
        <InteractiveShowcase onGetStarted={onGetStarted} />

        {/* 6 Core Feature Cards */}
        <FeaturesSection />

        {/* Old POS vs AI POS 2.0 Comparison & Store ROI Stats */}
        <BenefitsSection />

        {/* Retail Pricing Tiers with Monthly / Yearly Discount */}
        <PricingSection onGetStarted={onGetStarted} />

        {/* Top Retailer FAQ with Interactive Accordion */}
        <FAQSection />

        {/* High-Converting Final Call to Action */}
        <CTASection onGetStarted={onGetStarted} />
      </main>

      {/* Modern SaaS Footer */}
      <Footer />
    </div>
  )
}

export default LandingPage
