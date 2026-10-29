import ItwClient from '../../components/itw/ItwClient'

export const metadata = {
  title: 'Experience what they feel - Manas Learning',
  description: 'Four short interactive simulations of what autism, ADHD, dyslexia and speech differences can feel like.',
}

export default function ExperiencePage() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900;1000&family=Libre+Franklin:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700;800&display=swap"
        precedence="default"
      />
      <ItwClient />
    </>
  )
}
