/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */
import type {Metadata} from 'next'
import {Poppins, Patrick_Hand} from 'next/font/google'
import './globals.css'
import {Year} from './Year'
import MiloWidget from '../components/milo/MiloWidget'
import {FallingLeaves} from './FallingLeaves'
import {FaLinkedinIn, FaFacebookF, FaInstagram, FaYoutube} from 'react-icons/fa6'

const poppins = Poppins({subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins'})
const patrick = Patrick_Hand({subsets: ['latin'], weight: '400', variable: '--font-patrick'})

export const metadata: Metadata = {
  title: { default: 'Manas Learning — Child Development & Inclusive Learning Centre', template: '%s — Manas Learning' },
  description:
    'Pediatric learning, speech therapy, and sensory support for children in Chennai. Featuring free consultations, Milo our AI learning guide, and interactive simulations of neurodiverse learning experiences.',
  keywords: [
    'Manas Learning',
    'special education Chennai',
    'child development centre',
    'speech therapy Chennai',
    'occupational therapy autism',
    'dyslexia remedial education',
    'ADHD attention therapy',
    'In Their World simulation',
    'Milo AI learning guide',
    'VaakSiddhi breathing games',
    'Vaakify speech practice',
  ],
  authors: [{ name: 'Manas Learning' }],
  metadataBase: new URL('https://www.manaslearning.com'),
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: 'Manas Learning — Child Development & Inclusive Learning Centre',
    description:
      'Pediatric learning, speech, and sensory support for children with free consultations, Milo AI assistant, and empathetic neurodiversity simulations.',
    url: 'https://www.manaslearning.com',
    siteName: 'Manas Learning',
    images: [
      {
        url: '/decor/itw/supportive-environment.webp',
        width: 1376,
        height: 768,
        alt: 'Manas Learning supportive environment',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manas Learning — Child Development & Inclusive Learning Centre',
    description: 'Empathetic pediatric therapy, AI learning guidance, and interactive neurodiversity experiences.',
    images: ['/decor/itw/supportive-environment.webp'],
  },
}

const BASE = 'https://www.manaslearning.com'
const LIVE = BASE
const NAV: [string, string][] = [
  ['Home', '/'], ['About Us', '/#about'], ['Services', '/#services'], ['Experience', '/experience'],
  ['Assessments', LIVE + '/assessments'], ['Blogs', LIVE + '/blogs'], ['Videos', LIVE + '/videos'], ['Book a Consultation', '/consult'], ['Contact Us', '/#contact'],
]
const SOCIAL = [
  {label: 'LinkedIn', Icon: FaLinkedinIn, href: 'https://www.linkedin.com/company/manaslearning/', bg: 'bg-[#0a66c2] hover:bg-[#084e96]'},
  {label: 'Facebook', Icon: FaFacebookF, href: 'https://www.facebook.com/profile.php?id=100064128061294', bg: 'bg-[#1877F2] hover:bg-[#145dbf]'},
  {label: 'Instagram', Icon: FaInstagram, href: 'https://www.instagram.com/manaslearning/', bg: 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] hover:opacity-90'},
  {label: 'YouTube', Icon: FaYoutube, href: 'https://youtube.com/@manaslearning2790?si=0CKKehFd02H72uJ_', bg: 'bg-[#FF0000] hover:bg-[#cc0000]'},
]

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${patrick.variable} antialiased`}>
        <FallingLeaves />
        <header className="sticky top-0 z-50 w-full bg-white px-[10px] py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] md:py-4">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <a href="/" className="relative h-[50px] w-[70px] shrink-0">
              <img src="/logo.png" alt="Manas Learning Logo" className="absolute inset-0 h-full w-full object-contain object-left lg:scale-150" />
            </a>
            <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-7 xl:gap-9 lg:flex">
              {NAV.map(([label, href], i) => (
                <a key={label} href={href} className={`text-xl transition-colors duration-200 hover:text-primary ${i === 0 ? 'font-bold text-primary' : 'text-black'}`}>{label}</a>
              ))}
            </nav>
            <a href={LIVE + '/login'} className="rounded-lg border border-primary/40 bg-primary/10 px-5 py-1.5 text-xl text-primary transition hover:bg-primary/20">Login</a>
          </div>
          <nav aria-label="Main mobile" className="container mx-auto mt-2 flex gap-5 overflow-x-auto pb-1 text-lg lg:hidden">
            {NAV.map(([label, href]) => <a key={label} href={href} className="shrink-0 text-black hover:text-primary">{label}</a>)}
          </nav>
        </header>

        {children}

        <footer className="relative w-full bg-card-yellow/30">
          <div className="container mx-auto px-4 py-10 md:px-6 md:py-14 lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-16">
              <div className="space-y-6 lg:max-w-md">
                <img src="/logo.png" alt="Manas Learning Logo" width={150} height={150} className="h-[110px] w-[110px] object-contain object-left" />
                <div className="flex gap-4">
                  {SOCIAL.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white transition-colors ${s.bg}`}><s.Icon size={18} /></a>
                  ))}
                </div>
                <div className="space-y-3 text-lg text-black">
                  <p className="leading-relaxed">10G, Sapphire, Olympia Opaline, OMR, Navalur<br />Chennai, Tamilnadu, India - 600130.</p>
                  <p>Enquiry: <a className="underline hover:text-card-blue" href="mailto:support@manaslearning.com">support@manaslearning.com</a><br />
                    <a className="hover:text-card-blue" href="tel:+919884031293">(+91) 988-403-1293</a></p>
                </div>
              </div>
              <div className="flex gap-16 md:gap-24">
                <nav aria-label="Footer navigation">
                  <ul className="space-y-3 text-xl text-black">
                    {[['Assessments', LIVE + '/assessments'], ['Know More', LIVE + '/conditions'], ['About', '/#about'], ['Services', '/#services'], ['Experience', '/experience'], ['Blogs', LIVE + '/blogs'], ['Videos', LIVE + '/videos'], ['Locate Centres', 'https://www.google.com/maps/search/?api=1&query=Olympia+Opaline+Navalur+Chennai']].map(([l, h]) => (
                      <li key={l}><a href={h} className="hover:text-card-blue">{l}</a></li>
                    ))}
                  </ul>
                </nav>
                <nav aria-label="Footer consultation">
                  <ul className="space-y-3 text-xl text-black">
                    {[['Free Consultation', '/consult'], ['Expert Consultation', '/consult'], ['Ask Milo', '/milo'], ['Join Community', 'https://chat.whatsapp.com/IeobE2Zx5HMBft0xQEK7Vh?mode=gi_t']].map(([l, h]) => (
                      <li key={l}><a href={h} className="hover:text-card-blue">{l}</a></li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/70">
              <span>© <Year /> Manas Learning. All rights reserved.</span>
              {[['Terms of Service', '/terms-of-service'], ['Privacy Policy', '/privacy-policy'], ['Cancellation and Refund Policy', '/cancellation-refund-policy'], ['Delete your account', '/delete-your-account']].map(([l, h]) => (
                <a key={l} href={LIVE + h} className="underline hover:text-card-blue">{l}</a>
              ))}
            </div>
          </div>
        </footer>
        <MiloWidget />
      </body>
    </html>
  )
}
