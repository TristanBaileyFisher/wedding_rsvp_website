'use client';
import Header from './Sections/Header';
import MobileNavbar from './Components/mobileNavbar';
import Rsvp from './Sections/Rsvp';
import Open from './Sections/open'

//main colours:

export default function Home() {
  return (
    <div className='overflow-hidden'>
      <MobileNavbar />
      <div className='absolute z-10'>
        <Open />
      </div>

      <Header />
      <Rsvp />
    </div>
  );
}
