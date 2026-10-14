'use client';

import NavItems from './NavItems';

import { useEffect, useState } from 'react';

export default function MobileNavbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleResize = () => {
      if (mediaQuery.matches) {
        setOpen(false);
      }
    };

    handleResize();

    mediaQuery.addEventListener("change", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  return (
    <div><div onClick={() => setOpen(!open)} className={`fixed inset-0 bg-deeper-forest z-50 duration-200 ${open ? "opacity-50 pointer-events-auto" : " opacity-0 pointer-events-none"}`}></div>
      <div className={`w-70 z-51 h-screen bg-sage-green fixed top-0 right-0 duration-400 ease-in-out origin-right  ${open ? "" : "scale-x-0"}`}>
        <NavItems />
      </div>

      <div className="fixed top-0 right-0 z-50 p-10 block md:hidden z-52">

        <button
          className="flex flex-col gap-2 w-12 cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <span
            className={`h-1 w-12 bg-sage-green rounded-full transition-all duration-300 origin-right ${open ? "bg-text -rotate-45 translate-y-2.5 scale-x-50" : ""
              }`}
          />

          <span
            className={`h-1 w-12 bg-sage-green rounded-full transition-all duration-300 origin-right ${open ? "scale-x-0 opacity-0" : ""
              }`}
          />

          <span
            className={`h-1 w-12 bg-sage-green rounded-full transition-all duration-300 origin-right ${open ? "bg-text rotate-45 -translate-y-3 scale-x-50" : ""
              }`}
          />
        </button>
      </div>
    </div>

  );
}