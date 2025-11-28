'use client';

import { useLanguage } from '@/lib/language-context';

type ProfileSection = 'personal-information' | 'bookings';

interface ProfileSidebarProps {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
}

export function ProfileSidebar({ activeSection, onSectionChange }: ProfileSidebarProps) {
  const { t } = useLanguage();

  const sections: Array<{
    id: ProfileSection;
    icon: string;
    labelKey: string;
    labelFallback: string;
  }> = [
    {
      id: 'personal-information',
      icon: '👤',
      labelKey: 'profile.personal_information',
      labelFallback: 'Información personal',
    },
    {
      id: 'bookings',
      icon: '📋',
      labelKey: 'profile.bookings',
      labelFallback: 'Reservaciones',
    },
  ];

  return (
    <nav className="w-full lg:w-64 flex-shrink-0">
      <div className="space-y-2">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive
                    ? 'bg-tp-blue-primary/10 border-2 border-tp-blue-primary text-tp-blue-primary font-medium'
                    : 'border-2 border-transparent text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-xl">{section.icon}</span>
              <span>{t(section.labelKey, section.labelFallback)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
