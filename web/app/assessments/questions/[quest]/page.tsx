import QuestionsClient from './QuestionsClient'

// Known activities are prerendered at build time (required for Next 16 Cache Components).
export function generateStaticParams() {
  return [{ quest: 'dyslexia' }, { quest: 'adhd' }, { quest: 'autism' }]
}

export default async function QuestionsPage({ params }: { params: Promise<{ quest: string }> }) {
  const { quest } = await params
  return <QuestionsClient quest={quest} />
}
