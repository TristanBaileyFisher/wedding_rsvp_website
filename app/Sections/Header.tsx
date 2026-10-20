'use client';

import React from 'react';
import Image from 'next/image';
import Countdown from '../Components/countdown';
import FadeContent from '@/components/fade';


export default function Header({ isOpen }: { isOpen: boolean }) {
  return (
    <section
      id="section-header"
      className="relative min-h-screen overflow-hidden pb-24"
    >
      <Image
        src="/Images/rose4.png"
        alt=""
        fill
        sizes="100vw"
        quality={100}
        preload
        className="object-cover z-0"
      />






      {isOpen && (
        <FadeContent
          effect="mist"
          duration={1.8}
          ease="power2.out"
          stagger={0.1}
          threshold={0.1}
          trigger="mount"
          delay={2}

        >
          <div className="relative z-20 w-full h-screen flex flex-col justify-center items-center text-center text-white">


            <img src="svg/first_decoration.svg" className="w-24 h-auto text-white" alt="" />
            <div className="pb-2 font-antic flex text-center gap-5 items-center justify-center">
              <h2>SAVE</h2>
              <h2>THE</h2>
              <h2>DATE</h2>
            </div>
            <div className="flex-col items-center justify-center text-center">
              <h1 className="font-bodoni text-5xl">Simon Shanley</h1>
              <h1 className="font-carattere text-6xl text-sage-green leading-15">&</h1>
              <h1 className="font-bodoni text-5xl -translate-y-4">Tristan Fisher</h1>
            </div>
            <img src="svg/line_decoration.svg" className="w-40 h-auto -translate-y-10" alt="" />
            <div className="text-center flex flex-col gap-2 -translate-y-15">
              <h3 className="font-bodoni font-bold">September 18, 2027</h3>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.google.com/maps/dir//6894%20State%20Highway%202,%20Paeroa%203640"
                className="group inline-flex items-center gap-1 whitespace-nowrap font-bodoni italic hover:text-sage-green ease-in-out duration-300"
              >
                Historical Maritime Museum & Park, Paeroa
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0 group-hover:scale-125 ease-in-out duration-300">
                  <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                </svg>
              </a>

            </div>
            <div className='-translate-y-10'>
              <Countdown targetDate="2027-09-18T16:00:00" />
            </div>
            <div className='font-bodoni text-lg text-center -translate-y-5'>
              <h1>Until we say</h1>
              <h1>"I Do"</h1>
            </div>
            <a href="#section-rsvp" className='font-bodoni text-2xl border px-4 py-1 hover:text-dusty-rose ease-in-out duration-200 cursor-pointer'>
              RSVP HERE
            </a>
          </div>
        </FadeContent>
      )}
    </section>
  );
}
