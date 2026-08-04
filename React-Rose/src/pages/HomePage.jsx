import React from 'react'
import HeroSection from '../components/home/HeroSection'
import PopularCoursesSection from '../components/home/PopularCoursesSection'
import FeaturesSection from '../components/home/FeaturesSection'
import ReviewSection from '../components/home/ReviewSection'
import StatsCtaSection from '../components/home/StatsCtaSection'

function HomePage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <PopularCoursesSection />
      <ReviewSection />
      <StatsCtaSection />
    </div>
  )
}

export default HomePage
