'use client';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PeopleSelector } from './PeopleSelector';

interface EventDetailData {
  id: number;
  isAvailable: boolean;
  minAdultsPerBooking: number;
  availableAdultPlaces: number;
  fullPricePerGroup: Record<string, number>;
  payableNowPricePerGroup: Record<string, number>;
  isPartiallyPaid: boolean;
}

interface EventBookingFormProps {
  language: string;
  languageDisplayName: string;
  languageFlag: string;
  date: string;
  time: string;
  numberOfPeople: number;
  onNumberOfPeopleChange: (value: number) => void;
  name: string;
  onNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  eventDetailData?: EventDetailData;
  isLoading?: boolean;
  error?: Error | null;
  onSubmit: (e: React.FormEvent) => void;
}

// Format date for display
const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export function EventBookingForm({
  language,
  languageDisplayName,
  languageFlag,
  date,
  time,
  numberOfPeople,
  onNumberOfPeopleChange,
  name,
  onNameChange,
  email,
  onEmailChange,
  eventDetailData,
  isLoading = false,
  error,
  onSubmit,
}: EventBookingFormProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border-2 border-orange-500">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          Error al cargar los detalles del evento. Por favor, intenta de nuevo.
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
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
          <PeopleSelector
            eventDetailData={eventDetailData}
            value={numberOfPeople}
            onChange={onNumberOfPeopleChange}
            isLoading={isLoading}
          />
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
              onChange={(e) => onNameChange(e.target.value)}
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
              onChange={(e) => onEmailChange(e.target.value)}
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

