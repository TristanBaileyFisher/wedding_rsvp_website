'use client';

import { useState } from 'react';
import Header from './Sections/Header';
import MobileNavbar from './Components/mobileNavbar';
import Rsvp from './Sections/Rsvp';
import Open from './Sections/open'
import Galaxy from '@/components/firefly';

//main colours:

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
        <Galaxy
          className="h-full w-full"
          density={0.9}
          glowIntensity={1}
          flareIntensity={0.0}
          starSpeed={0}
          mouseRepulsion={false}
          clickWarp={false}
          starColors={["#FAF8F2", "#DCE8E1", "#C7A96B"]}
          hueShift={140}
          saturation={1}
          starSize={0.35}
          twinkleIntensity={1}
          speed={0.5}
          rotationSpeed={0}
          layers={2}
          direction="backward"
          repulsionStrength={2}
          mouseInteraction
          intro
          lightMode={false}
        />
      </div>

      {/*<div className="relative z-20">
        <MobileNavbar />
      </div>*/}
      <div className='absolute inset-0 z-30 pointer-events-none'>
        <Open isOpen={isOpen} onOpen={() => setIsOpen(true)} />
      </div>

      <main>
        <Header isOpen={isOpen} />
        <Rsvp />
      </main>
    </div>
  );
}
