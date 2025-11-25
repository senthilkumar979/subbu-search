"use client";

import { ArrowUp, Globe, Heart, Mail, Phone } from "lucide-react";
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

const CONTACTS = [
  {
    href: "tel:+04366-1950",
    icon: <Phone className="h-4 w-4 text-pink-400 shrink-0" />,
    label: "043661950",
  },
  {
    href: "mailto:mentorbridgeindia@gmail.com",
    icon: <Mail className="h-4 w-4 text-emerald-400 shrink-0" />,
    label: "mentorbridgeindia@gmail.com",
  },
  {
    href: "https://www.mentorbridge.in",
    icon: <Globe className="h-4 w-4 text-red-400 shrink-0" />,
    label: "www.mentorbridge.in",
  },
];

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
      return (
        <span>
          <span className="block font-bold text-base text-white">
            வாக்காளர் பட்டியல் தேடல் அமைப்பு
          </span>
          <span className="block mt-0.5 text-xs text-cyan-100">
            Electoral Roll Search System &ndash; Thiruvarur District
          </span>
        </span>
      );
    }

    const acNumber = constituency.replace("AC", "");
    const names = CONSTITUENCY_NAMES[constituency];

    if (names) {
      return (
        <span>
          <span className="block font-bold text-base text-white">
            {names.ta} சட்டமன்ற தொகுதி {acNumber}-ன் வாக்காளர் பட்டியல் தேடல்
            அமைப்பு
          </span>
          <span className="block mt-0.5 text-xs text-cyan-100">
            Electoral Roll Search System for {names.en} Assembly {acNumber}
          </span>
        </span>
      );
    }

    return (
      <span>
        <span className="block font-bold text-base text-white">
          சட்டமன்ற தொகுதி {acNumber}-ன் வாக்காளர் பட்டியல் தேடல் அமைப்பு
        </span>
        <span className="block mt-0.5 text-xs text-cyan-100">
          Electoral Roll Search System for Assembly Constituency {acNumber}
        </span>
      </span>
    );
  };

  return (
    <>
      <footer className="relative bg-gradient-to-r from-blue-900/90 to-blue-700/80 text-blue-50 pt-6 pb-2 border-t border-blue-200/10 mt-auto">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
            {/* Footer Statement */}
            <div className="flex-1 text-center md:text-left px-3">
              {getFooterText()}
            </div>

            {/* Contact Links */}
            <div className="flex-1 flex flex-col md:flex-row md:justify-end items-center gap-1.5 md:gap-6 text-xs mt-3 md:mt-0">
              {CONTACTS.map((c, idx) => (
                <a
                  key={c.href}
                  href={c.href}
                  className="flex items-center gap-2 hover:bg-white/5 px-3 py-1.5 rounded transition"
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    c.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                >
                  {c.icon}
                  <span className="font-medium">{c.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mt-6 border-t border-blue-100/15"></div>

          {/* Credits & Copyright */}
          <div className="mt-2 flex flex-col items-center justify-center text-xs gap-2">
            <div>
              <span className="text-gray-400">
                © {new Date().getFullYear()} Thiruvarur District. All rights
                reserved.
              </span>
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="text-gray-400">Powered by MentorBridge</span>
              <Heart className="h-3 w-3 text-pink-400" />
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 z-50 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-800 transition-opacity duration-300 text-white rounded-full p-3 shadow-2xl focus:outline-none focus:ring-4 focus:ring-cyan-300/30"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
