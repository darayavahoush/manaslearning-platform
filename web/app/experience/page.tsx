import type { Metadata } from 'next'
import ItwClient from '../../components/itw/ItwClient'

export const metadata: Metadata = {
  title: 'In Their World — Interactive Neurodiversity & Learning Simulations | Manas Learning',
  description:
    'Step into their world for a few minutes. Interactive first-person simulations and illustrated storybooks exploring sensory processing (Autism), attentional regulation (ADHD), phonological decoding (Dyslexia), speech pacing (AAC), dyscalculia, dysgraphia, and inclusive classroom support.',
  keywords: [
    'neurodiversity simulations',
    'autism sensory experience',
    'ADHD focus simulator',
    'dyslexia reading decoding',
    'speech delay AAC simulator',
    'dyscalculia math manipulatives',
    'dysgraphia motor fatigue',
    'auditory processing disorder',
    'Down syndrome school inclusion',
    'inclusive education India',
    'special education Chennai',
    'Manas Learning In Their World',
  ],
  authors: [{ name: 'Manas Learning Special Education Team' }],
  openGraph: {
    title: 'In Their World — Experience What They Feel | Manas Learning',
    description:
      'First-person interactive simulations and illustrated storybooks of autism, ADHD, dyslexia, and speech differences. Evidence-grounded, empathetic, and paired with actionable accommodations.',
    url: 'https://web-vert-nu-vcsh56lv8l.vercel.app/experience',
    siteName: 'Manas Learning',
    images: [
      {
        url: '/decor/itw/supportive-environment.webp',
        width: 1376,
        height: 768,
        alt: 'Children collaborating in an inclusive, supportive learning environment',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'In Their World — Experience What They Feel',
    description:
      'First-person interactive simulations of sensory, attentional, and reading differences. Designed with pediatric clinical rigor.',
    images: ['/decor/itw/supportive-environment.webp'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LearningResource',
  name: 'In Their World: Neurodiversity & Special Education Interactive Experiences',
  description:
    'An interactive experiential suite simulating sensory filtering, ADHD working memory load, dyslexia phonological decoding, and inclusive pedagogical accommodations.',
  publisher: {
    '@type': 'EducationalOrganization',
    name: 'Manas Learning',
    url: 'https://www.manaslearning.com',
  },
  learningResourceType: 'Interactive Simulation',
  educationalLevel: 'Educator, Parent, and Student Professional Development',
  inLanguage: 'en-IN',
  isAccessibleForFree: true,
}

export default function ExperiencePage() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900;1000&family=Libre+Franklin:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700;800&display=swap"
        precedence="default"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ItwClient />
    </>
  )
}
