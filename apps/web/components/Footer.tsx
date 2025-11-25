"use client";

import { ArrowUp, Globe, HeartIcon, Mail } from "lucide-react";
import { useEffect, useState } from "react";

interface FooterProps {
  constituency?: string;
}

const CONSTITUENCY_NAMES: Record<string, { en: string; ta: string }> = {
  AC173: { en: "Nannilam", ta: "நன்னிலம்" },
  AC177: { en: "Tiruthuraipoondi", ta: "திருத்துறைப்பூண்டி" },
  AC174: { en: "Tiruvarur", ta: "திருவாரூர்" },
  AC178: { en: "Mannargudi", ta: "மன்னார்குடி" },
};

export default function Footer({ constituency }: FooterProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getFooterText = () => {
    if (!constituency) {
      return "வாக்காளர் பட்டியல் தேடல் அமைப்பு - திருவாரூர் மாவட்டம் / Electoral Roll Search System - Thiruvarur District";
    }

    const acNumber = constituency.replace("AC", "");
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
                href="tel:0461-2340099"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <HeartIcon className="h-3.5 w-3.5" />
                <span>MentorBridge</span>
              </a>
              <a
                href="mailto:deo_tuticorin@yahoo.co.in"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>mentorbridgeindia@gmail.com</span>
              </a>
              <a
                href="https://www.mentorbridge.in"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>www.mentorbridge.in</span>
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
