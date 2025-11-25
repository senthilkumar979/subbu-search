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
      return `${names.en} Assembly Constituency - ${number}`;
    }

    return `Assembly Constituency - ${number}`;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-3 lg:py-4">
        <div className="text-center flex flex-col lg:flex-row gap-3 lg:gap-0 justify-between items-center">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-900 text-sm lg:text-lg font-semibold"
            >
              <HomeIcon className="h-4 w-4" />
              Home
            </Link>
          </div>
          <h1 className="text-base lg:text-xl font-bold text-blue-900 leading-tight">
            Special Intensive Revision
          </h1>
          <p className="text-sm lg:text-lg font-semibold text-gray-700 mt-0.5 lg:mt-1">
            2002 Data Thiruvarur District
            {constituency && ` | ${getConstituencyInfo(constituency)}`}
          </p>
        </div>
      </div>
    </header>
  );
}
