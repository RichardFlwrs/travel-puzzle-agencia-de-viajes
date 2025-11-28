'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { ProfileSidebar } from './ProfileSidebar';
import { PersonalInformation } from './PersonalInformation';
import { Bookings } from './Bookings';

type ProfileSection = 'personal-information' | 'bookings';

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    bookings: number;
  };
}

interface ProfileClientProps {
  user: User;
}

export function ProfileClient({ user }: ProfileClientProps) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal-information');

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      {/* Sidebar Navigation */}
      <ProfileSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <div className="flex-1">
        {activeSection === 'personal-information' && (
          <PersonalInformation user={user} />
        )}
        {activeSection === 'bookings' && (
          <Bookings bookingsCount={user._count.bookings} />
        )}
      </div>
    </div>
  );
}
