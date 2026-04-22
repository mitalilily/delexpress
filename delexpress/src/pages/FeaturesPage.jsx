import CommerceSections from '../components/landing/CommerceSections'
import OperationsSections from '../components/landing/OperationsSections'
import SocialSections from '../components/landing/SocialSections'

export default function FeaturesPage() {
  return (
    <>
      <CommerceSections showTools={false} showProblem={false} />
      <OperationsSections />
      <SocialSections showFaq={false} showLegal={false} showTestimonials={false} />
    </>
  )
}
