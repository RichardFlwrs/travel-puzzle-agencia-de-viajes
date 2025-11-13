'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChevronDownIcon } from '@/assets/svg';

interface EventBookingFormProps {
  language: string;
  languageDisplayName: string;
  languageFlag: string;
  date: string;
  time: string;
  eventDetailData?: {
    id: number;
    isAvailable: boolean;
    minAdultsPerBooking: number;
    availableAdultPlaces: number;
    fullPricePerGroup: Record<string, number>;
    payableNowPricePerGroup: Record<string, number>;
    isPartiallyPaid: boolean;
  };
}

const LANGUAGE_FLAGS: Record<string, string> = {
  'English': '🇬🇧',
  'Spanish': '🇪🇸',
  'Portuguese': '🇵🇹',
  'German': '🇩🇪',
  'French': '🇫🇷',
  'Italian': '🇮🇹',
};

const LANGUAGE_NAMES: Record<string, string> = {
  'English': 'Inglés',
  'Spanish': 'Español',
  'Portuguese': 'Portugués',
  'German': 'Alemán',
  'French': 'Francés',
  'Italian': 'Italiano',
};

// Format date for display
const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export function EventBookingForm({
  language,
  languageDisplayName,
  languageFlag,
  date,
  time,
  eventDetailData,
}: EventBookingFormProps) {
  const [numberOfPeople, setNumberOfPeople] = useState<number>(2);
  const [isPeopleDropdownOpen, setIsPeopleDropdownOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const peopleDropdownRef = useRef<HTMLDivElement>(null);

  // Generate people options based on available places
  const maxPeople = eventDetailData?.availableAdultPlaces || 30;
  const minPeople = eventDetailData?.minAdultsPerBooking || 2;
  const peopleOptions = Array.from({ length: maxPeople - minPeople + 1 }, (_, i) => minPeople + i);

  // Calculate price per person
  const pricePerPerson = eventDetailData?.fullPricePerGroup?.[numberOfPeople.toString()]
    ? eventDetailData.fullPricePerGroup[numberOfPeople.toString()] / numberOfPeople
    : 65; // Default fallback

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (peopleDropdownRef.current && !peopleDropdownRef.current.contains(event.target as Node)) {
        setIsPeopleDropdownOpen(false);
      }
    };

    if (isPeopleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPeopleDropdownOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', { language, date, time, numberOfPeople, name, email });
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg border-2 border-orange-500">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Tour Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">1. Detalles del tour</h2>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium mb-2">Idioma</label>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md">
              <span className="text-lg">{languageFlag}</span>
              <span>{languageDisplayName}</span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Fecha del tour</label>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md">
              <span>📅</span>
              <span>{formatDateDisplay(date)}</span>
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium mb-2">Hora de inicio</label>
            <div className="px-4 py-2 bg-white border border-gray-300 rounded-md">
              <span>{time}</span>
            </div>
          </div>

          {/* Number of People */}
          <div>
            <label className="block text-sm font-medium mb-2">Numero de personas</label>
            <div className="relative" ref={peopleDropdownRef}>
              <button
                type="button"
                onClick={() => setIsPeopleDropdownOpen(!isPeopleDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span>{numberOfPeople} personas</span>
                <ChevronDownIcon isOpen={isPeopleDropdownOpen} className="w-4 h-4" />
              </button>
              {isPeopleDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b">
                    {minPeople} to {maxPeople} - €{pricePerPerson.toFixed(0)}/persona
                  </div>
                  {peopleOptions.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setNumberOfPeople(num);
                        setIsPeopleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                        numberOfPeople === num ? 'bg-blue-50 font-medium' : ''
                      }`}
                    >
                      {num} personas
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Your Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">2. Tus detalles</h2>

          {/* Name */}
          <div>
            <Input
              type="text"
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Email */}
          <div>
            <Input
              type="email"
              label="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" variant="accent">
            Editar
          </Button>
        </div>
      </form>
    </div>
  );
}

