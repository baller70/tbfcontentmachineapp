
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { SessionProvider } from '@/components/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Late Content Poster - Social Media Automation',
  description: 'Automate your social media content posting across all platforms with AI-generated content and smart scheduling.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Russo+One&family=Roboto:wght@300;400;700;900&family=Open+Sans:wght@300;400;600;700;800&family=Lato:wght@300;400;700;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Oswald:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Bebas+Neue&family=Anton&family=Playfair+Display:wght@400;700;900&family=Merriweather:wght@300;400;700;900&family=PT+Serif:wght@400;700&family=Crimson+Text:wght@400;600;700&family=Libre+Baskerville:wght@400;700&family=EB+Garamond:wght@400;500;600;700;800&family=Lora:wght@400;500;600;700&family=Spectral:wght@300;400;600;700;800&family=Cormorant:wght@300;400;500;600;700&family=Ubuntu:wght@300;400;500;700&family=Nunito:wght@300;400;600;700;800;900&family=Rubik:wght@300;400;500;600;700;800;900&family=Work+Sans:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=Barlow:wght@300;400;500;600;700;800;900&family=Nunito+Sans:wght@300;400;600;700;800;900&family=Oxygen:wght@300;400;700&family=Mukta:wght@300;400;500;600;700;800&family=Quicksand:wght@300;400;500;600;700&family=Karla:wght@300;400;500;600;700;800&family=Hind:wght@300;400;500;600;700&family=Cabin:wght@400;500;600;700&family=Asap:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600;700;800;900&family=Titillium+Web:wght@300;400;600;700;900&family=Fira+Sans:wght@300;400;500;600;700;800;900&family=Lobster&family=Pacifico&family=Righteous&family=Permanent+Marker&family=Fredoka+One&family=Archivo+Black&family=Alfa+Slab+One&family=Bangers&family=Bungee&family=Fugaz+One&family=Passion+One:wght@400;700;900&family=Shadows+Into+Light&family=Satisfy&family=Great+Vibes&family=Dancing+Script:wght@400;500;600;700&family=Kaushan+Script&family=Amatic+SC:wght@400;700&family=Indie+Flower&family=Caveat:wght@400;500;600;700&family=Fjalla+One&family=Yanone+Kaffeesatz:wght@300;400;500;600;700&family=Pathway+Gothic+One&family=Squada+One&family=Staatliches&family=Barlow+Condensed:wght@300;400;500;600;700;800;900&family=Saira+Condensed:wght@300;400;500;600;700;800;900&family=Archivo+Narrow:wght@400;500;600;700&family=Abel&family=Economica:wght@400;700&family=Roboto+Mono:wght@300;400;500;600;700&family=Source+Code+Pro:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&family=Inconsolata:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Fira+Mono:wght@400;500;700&family=Anonymous+Pro:wght@400;700&family=Overpass+Mono:wght@300;400;500;600;700&family=Comfortaa:wght@300;400;500;600;700&family=Zilla+Slab:wght@300;400;500;600;700&family=Bitter:wght@300;400;500;600;700;800;900&family=Arvo:wght@400;700&family=Slabo+27px&family=Dosis:wght@300;400;500;600;700;800&family=Signika:wght@300;400;500;600;700&family=Francois+One&family=Kanit:wght@300;400;500;600;700;800;900&family=Josefin+Sans:wght@300;400;500;600;700&family=Varela+Round&family=Muli:wght@300;400;600;700;800;900&family=Prompt:wght@300;400;500;600;700;800;900&family=Noto+Sans:wght@300;400;500;600;700;800;900&family=Heebo:wght@300;400;500;600;700;800;900&family=Libre+Franklin:wght@300;400;500;600;700;800;900&family=Crete+Round&family=Rokkitt:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={true}
            disableTransitionOnChange={false}
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
