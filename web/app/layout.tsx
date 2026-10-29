import type {Metadata} from 'next'
import {Poppins, Patrick_Hand} from 'next/font/google'
import './globals.css'
import {Year} from './Year'
import MiloWidget from '../components/milo/MiloWidget'
import {FallingLeaves} from './FallingLeaves'

const poppins = Poppins({subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-poppins'})
const patrick = Patrick_Hand({subsets: ['latin'], weight: '400', variable: '--font-patrick'})

export const metadata: Metadata = {title: 'Book a Consultation - Manas Learning'}

const BASE = 'https://www.manaslearning.com'
const NAV: [string, string][] = [
  ['Home', '/'], ['About Us', '/about'], ['Services', '/services'], ['Blogs', '/blogs'], ['Videos', '/videos'], ['Contact Us', '/contact'],
]
const SOCIAL = [
  {label: 'LinkedIn', short: 'in', href: 'https://www.linkedin.com/company/manaslearning/', bg: 'bg-[#0a66c2] hover:bg-[#084e96]'},
  {label: 'Facebook', short: 'f', href: 'https://www.facebook.com/profile.php?id=100064128061294', bg: 'bg-[#1877F2] hover:bg-[#145dbf]'},
  {label: 'Instagram', short: 'ig', href: 'https://www.instagram.com/manaslearning/', bg: 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] hover:opacity-90'},
  {label: 'YouTube', short: '▶', href: 'https://youtube.com/@manaslearning2790?si=0CKKehFd02H72uJ_', bg: 'bg-[#FF0000] hover:bg-[#cc0000]'},
]

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${patrick.variable} antialiased`}>
        <FallingLeaves />
        <header className="sticky top-0 z-50 w-full bg-background px-[10px] py-2 md:py-4">
          <div className="container mx-auto flex items-center justify-between">
            <a href={BASE} className="relative h-[50px] w-[50px] shrink-0">
              <img src="/logo.png" alt="Manas Learning Logo" className="absolute inset-0 h-full w-full object-contain object-left lg:scale-150" />
            </a>
            <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-[36px] lg:flex">
              {NAV.map(([label, href]) => (
                <a key={label} href={BASE + href} className="text-xl text-black transition-all duration-300 hover:text-2xl hover:text-primary">{label}</a>
              ))}
            </nav>
            <a href="/consult" className="rounded-full bg-primary px-5 py-2 text-lg text-white shadow-sm transition hover:bg-brand-orange">Book a consultation</a>
          </div>
          <nav aria-label="Main mobile" className="container mx-auto mt-2 flex gap-5 overflow-x-auto text-lg lg:hidden">
            {NAV.map(([label, href]) => <a key={label} href={BASE + href} className="shrink-0 text-black hover:text-primary">{label}</a>)}
          </nav>
        </header>

        {children}

        <footer className="relative mt-16 w-full bg-card-yellow/30">
          <div className="container mx-auto px-4 py-10 md:px-6 md:py-14 lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-16">
              <div className="space-y-6 lg:max-w-md">
                <img src="/logo.png" alt="Manas Learning Logo" width={150} height={50} className="h-[50px] w-[150px] object-contain object-left" />
                <div className="flex gap-4">
                  {SOCIAL.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white transition-colors ${s.bg}`}>{s.short}</a>
                  ))}
                </div>
                <div className="space-y-3 text-lg text-black">
                  <p className="leading-relaxed">10G, Sapphire, Olympia Opaline, OMR, Navalur<br />Chennai, Tamilnadu, India - 600130.</p>
                  <p>Enquiry: <a className="underline hover:text-card-blue" href="mailto:support@manaslearning.com">support@manaslearning.com</a><br />
                    <a className="hover:text-card-blue" href="tel:+919884031293">(+91) 988-403-1293</a></p>
                </div>
              </div>
              <nav aria-label="Footer navigation">
                <ul className="space-y-3 text-xl text-black">
                  {[['Assessments', '/assessments'], ['Know More', '/conditions'], ['About', '/about'], ['Services', '/services'], ['Blogs', '/blogs'], ['Videos', '/videos']].map(([l, h]) => (
                    <li key={l}><a href={BASE + h} className="hover:text-card-blue">{l}</a></li>
                  ))}
                </ul>
              </nav>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/70">
              <span>© <Year /> Manas Learning. All rights reserved.</span>
              {[['Terms of Service', '/terms-of-service'], ['Privacy Policy', '/privacy-policy'], ['Cancellation and Refund Policy', '/cancellation-refund-policy']].map(([l, h]) => (
                <a key={l} href={BASE + h} className="underline hover:text-card-blue">{l}</a>
              ))}
            </div>
          </div>
        </footer>
        <MiloWidget />
      </body>
    </html>
  )
}
