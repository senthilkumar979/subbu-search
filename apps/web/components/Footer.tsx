'use client';

import { ArrowUp, Phone, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FooterProps {
  constituency?: string;
}

const CONSTITUENCY_NAMES: Record<string, { en: string; ta: string }> = {
  'AC210': { en: 'Vilathikulam', ta: 'விளாத்திகுளம்' },
  'AC211': { en: 'Ottapidaram (SC)', ta: 'ஓட்டப்பிடாரம் (தனி)' },
  'AC212': { en: 'Kovilpatti', ta: 'கோவில்பட்டி' },
  'AC224': { en: 'Sattankulam', ta: 'சாத்தான்குளம்' },
  'AC225': { en: 'Tiruchendur', ta: 'திருச்செந்தூர்' },
  'AC226': { en: 'Srivaikuntam', ta: 'ஸ்ரீவைகுண்டம்' },
  'AC227': { en: 'Thoothukudi', ta: 'தூத்துக்குடி' },
  'AC173': { en: 'Nannilam', ta: 'நந்நிலம்' },
};

export default function Footer({ constituency }: FooterProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getFooterText = () => {
    if (!constituency) {
      return "வாக்காளர் பட்டியல் தேடல் அமைப்பு - தூத்துக்குடி மாவட்டம் / Electoral Roll Search System - Thiruvarur District";
    }

    const acNumber = constituency.replace('AC', '');
    const names = CONSTITUENCY_NAMES[constituency];

    if (names) {
      return `${names.ta} சட்டமன்ற தொகுதி ${acNumber}-ன் வாக்காளர் பட்டியல் தேடல் அமைப்பு / Electoral Roll Search System for ${names.en} Assembly Constituency ${acNumber}`;
    }

    return `சட்டமன்ற தொகுதி ${acNumber}-ன் வாக்காளர் பட்டியல் தேடல் அமைப்பு / Electoral Roll Search System for Assembly Constituency ${acNumber}`;
  };

  return (
    <>
      <footer className="bg-gray-800 text-gray-300 py-4 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-3 text-center text-xs lg:text-sm">
            {/* Purpose Statement */}
            <div className="text-sm lg:text-base font-medium">
              {getFooterText()}
            </div>

            {/* Contact Information */}
            <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-6 text-xs lg:text-sm mt-2">
              <a
                href="tel:0461-1950"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Help: 0461-1950</span>
              </a>
              <a
                href="tel:0461-2340099"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>0461-2340099</span>
              </a>
              <a
                href="mailto:deo_tuticorin@yahoo.co.in"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>deo_tuticorin@yahoo.co.in</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-3 shadow-lg transition-all duration-300"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
