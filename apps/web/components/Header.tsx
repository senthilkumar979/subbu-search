"use client";

interface HeaderProps {
  constituency?: string;
}

const CONSTITUENCY_NAMES: Record<string, { en: string; ta: string }> = {
  AC210: { en: "Vilathikulam", ta: "விளாத்திகுளம்" },
  AC211: { en: "Ottapidaram (SC)", ta: "ஓட்டப்பிடாரம் (தனி)" },
  AC212: { en: "Kovilpatti", ta: "கோவில்பட்டி" },
  AC224: { en: "Sattankulam", ta: "சாத்தான்குளம்" },
  AC225: { en: "Tiruchendur", ta: "திருச்செந்தூர்" },
  AC226: { en: "Srivaikuntam", ta: "ஸ்ரீவைகுண்டம்" },
  AC227: { en: "Thoothukudi", ta: "தூத்துக்குடி" },
  AC173: { en: "Nannilam", ta: "நந்நிலம்" },
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
        <div className="text-center">
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
