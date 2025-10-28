// app/(marketing)/page.tsx
import { Hero } from '@/components/sections/Hero'
import { Amenities } from '@/components/sections/Amenities'
import { Plans } from '@/components/sections/Plans'
import { Gallery } from '@/components/sections/Gallery'
import { Testimonials } from '@/components/sections/Testimonials'
import { FAQ } from '@/components/sections/FAQ'
import { ContactBlock } from '@/components/sections/ContactBlock'

export default function Page() {
  return (
    <>
      <Hero />
      <Amenities />
      <Plans />
      <Gallery />
      <Testimonials />
      <FAQ />
      <ContactBlock />
    </>
  )
}
