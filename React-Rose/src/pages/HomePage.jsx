import React from 'react'
import HeroSection from '../components/home/HeroSection'
import PopularCoursesSection from '../components/home/PopularCoursesSection'
import RecentCoursesSection from '../components/home/RecentCoursesSection'
import FeaturesSection from '../components/home/FeaturesSection'
import ReviewSection from '../components/home/ReviewSection'

function HomePage() {
  return (
    <>
      <HeroSection />
      <PopularCoursesSection />
      <RecentCoursesSection />
      <FeaturesSection />
      <ReviewSection />
    </>
  )
}

export default HomePage
