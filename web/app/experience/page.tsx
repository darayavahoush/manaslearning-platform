import type { Metadata } from 'next'
import ItwClient from '../../components/itw/ItwClient'

export const metadata: Metadata = {
  title: 'In Their World — Interactive Neurodiversity & Learning Experiences | Manas Learning',
  description:
    'Interactive learning experiences and illustrated perspectives exploring task demands, classroom accessibility barriers, and evidence-based supports across autism, ADHD, dyslexia, speech and communication differences, dyscalculia, dysgraphia, and Down syndrome.',
  keywords: [
    'neurodiversity learning experiences',
    'autism sensory processing supports',
    'ADHD attentional regulation',
    'dyslexia reading decoding supports',
    'speech AAC communication access',
    'dyscalculia math manipulatives',
    'dysgraphia transcription scaffolding',
    'auditory processing accommodations',
    'Down syndrome school inclusion',
    'inclusive education India',
    'special education Chennai',
    'Manas Learning In Their World',
  ],
  authors: [{ name: 'Manas Learning Special Education Team' }],
  openGraph: {
    title: 'In Their World — Learning Differences & Accommodations | Manas Learning',
    description:
      'Interactive learning experiences and illustrated perspectives exploring learning differences and classroom accessibility. Grounded in pediatric and pedagogical evidence, paired with actionable accommodations.',
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
    title: 'In Their World — Learning Differences & Accommodations',
    description:
      'Interactive learning experiences exploring sensory, attentional, and reading differences. Designed to illustrate classroom barriers and effective supports.',
    images: ['/decor/itw/supportive-environment.webp'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LearningResource',
  name: 'In Their World: Neurodiversity & Special Education Interactive Experiences',
  description:
    'An interactive educational suite exploring environmental barriers, task demands, and inclusive pedagogical accommodations across neurodiversity.',
  publisher: {
    '@type': 'EducationalOrganization',
    name: 'Manas Learning',
    url: 'https://www.manaslearning.com',
  },
  learningResourceType: 'Interactive Learning Resource',
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
