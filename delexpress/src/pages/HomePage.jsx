import CommerceSections from '../components/landing/CommerceSections'
import HeroSection from '../components/landing/HeroSection'
import OperationsSections from '../components/landing/OperationsSections'
import SocialSections from '../components/landing/SocialSections'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CommerceSections />
      <OperationsSections showHowItWorks={false} showTracking={false} />
      <SocialSections showLegal={false} />
    </>
  )
}
