"use client";

import { HomeIcon } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  constituency?: string;
}

const CONSTITUENCY_NAMES: Record<string, { en: string; ta: string }> = {
  AC173: { en: "Nannilam", ta: "நன்னிலம்" },
  AC177: { en: "Tiruthuraipoondi", ta: "திருத்துறைப்பூண்டி" },
  AC174: { en: "Tiruvarur", ta: "திருவாரூர்" },
  AC178: { en: "Mannargudi", ta: "மன்னார்குடி" },
};

export default function Header({ constituency }: HeaderProps) {
  const getConstituencyInfo = (tsc: string) => {
    const number = tsc.replace("AC", "");
    const names = CONSTITUENCY_NAMES[tsc];

    if (names) {
      return {
        en: `${names.en} Assembly Constituency - ${number}`,
        ta: `${names.ta} தொகுதி - ${number}`,
      };
    }

    return {
      en: `Assembly Constituency - ${number}`,
      ta: `தொகுதி - ${number}`,
    };
  };

  const constituencyLabel = constituency
    ? getConstituencyInfo(constituency)
    : null;

  return (
    <header className="bg-gradient-to-r from-blue-950 to-blue-500 sticky top-0 z-20 shadow-md">
      <div className="mx-auto max-w-5xl px-4 py-3 lg:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        {/* Home Link */}
        <div className="order-2 sm:order-1 flex justify-center sm:justify-start">
          <Link
            href="/"
            className="flex items-center gap-2 text-white text-base font-bold tracking-tight hover:text-blue-200 transition"
          >
            <HomeIcon className="h-5 w-5" />
            <span className="">Home</span>
          </Link>
        </div>

        {/* App Title & Subtitle */}
        <div className="order-1 sm:order-2 flex-1 text-center">
          <h1 className="text-lg lg:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
            Special Intensive Revision
          </h1>
          <p className="text-xs lg:text-sm text-blue-100 font-medium mt-0.5">
            2002 Data &bull; Thiruvarur District
          </p>
        </div>

        {/* AC Info */}
        <div className="order-3 flex flex-col items-end text-right min-w-[10rem] sm:items-end sm:text-center sm:justify-center justify-end items-center text-center">
          {constituencyLabel && (
            <>
              <p className="text-sm lg:text-base font-medium text-blue-100 leading-tight">
                {constituencyLabel.en}
              </p>
              <p className="text-xs lg:text-sm font-semibold text-blue-200 leading-tight">
                {constituencyLabel.ta}
              </p>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
