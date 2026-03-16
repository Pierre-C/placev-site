// app/page.tsx
import { auth } from '@/lib/auth'
import { Hero } from '@/components/sections/Hero'
import { Amenities } from '@/components/sections/Amenities'
import { Plans } from '@/components/sections/Plans'
import { Gallery } from '@/components/sections/Gallery'
import { Mission } from '@/components/sections/Mission'
import { Testimonials } from '@/components/sections/Testimonials'
import { Events } from '@/components/sections/Events'
import { FAQ } from '@/components/sections/FAQ'
import { ContactBlock } from '@/components/sections/ContactBlock'

export default async function Page() {
  const session = await auth()
  return (
    <>
      <Hero isConnected={!!session?.user} />
      <Amenities />
      <Plans isConnected={!!session?.user} />
      <Gallery />
      <Mission />
      <Testimonials />
      <Events />
      <FAQ />
      <ContactBlock />
    </>
  )
}
