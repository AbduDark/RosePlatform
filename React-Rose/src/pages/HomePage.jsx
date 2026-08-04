import React from 'react'
import HeroSection from '../components/home/HeroSection'
import PopularCoursesSection from '../components/home/PopularCoursesSection'
import ReviewSection from '../components/home/ReviewSection'
import FeaturesSection from '../components/home/FeaturesSection'

function HomePage() {
  return (
    <>
      <HeroSection />
      <PopularCoursesSection />
      <ReviewSection />
      <FeaturesSection />
    </>
  )
}

export default HomePage
