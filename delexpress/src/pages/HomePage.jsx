import CommerceSections from '../components/landing/CommerceSections'
import HeroSection from '../components/landing/HeroSection'
import OperationsSections from '../components/landing/OperationsSections'
import RateCalculatorTool from '../components/landing/RateCalculatorTool'
import SocialSections from '../components/landing/SocialSections'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CommerceSections afterToolsContent={<RateCalculatorTool />} />
      <OperationsSections showHowItWorks={false} showTracking={false} />
      <SocialSections showLegal={false} />
    </>
  )
}
