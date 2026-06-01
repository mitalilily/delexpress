import CommerceSections from '../components/landing/CommerceSections'
import RateCalculatorTool from '../components/landing/RateCalculatorTool'
import SocialSections from '../components/landing/SocialSections'

export default function ToolsPage() {
  return (
    <>
      <CommerceSections
        showNetwork={false}
        showProblem={false}
        afterToolsContent={<RateCalculatorTool />}
      />
      <SocialSections showFaq={false} showLegal={false} />
    </>
  )
}
