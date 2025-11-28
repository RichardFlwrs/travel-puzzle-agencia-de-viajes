'use client';

import { useLanguage } from '@/lib/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PersonalInformationProps {
  user: User;
}

interface InfoField {
  labelKey: string;
  labelFallback: string;
  value: string | null;
  hasValue: boolean;
}

export function PersonalInformation({ user }: PersonalInformationProps) {
  const { t } = useLanguage();

  const fields: InfoField[] = [
    {
      labelKey: 'profile.full_name_label',
      labelFallback: 'Nombre completo',
      value: user.name,
      hasValue: !!user.name,
    },
    {
      labelKey: 'profile.email_label',
      labelFallback: 'Correo electrónico',
      value: user.email,
      hasValue: !!user.email,
    },
    {
      labelKey: 'profile.phone_label',
      labelFallback: 'Teléfono',
      value: null, // Not in schema yet
      hasValue: false,
    },
    {
      labelKey: 'profile.date_of_birth_label',
      labelFallback: 'Fecha de nacimiento',
      value: null, // Not in schema yet
      hasValue: false,
    },
    {
      labelKey: 'profile.home_town_label',
      labelFallback: 'Ciudad de origen',
      value: null, // Not in schema yet
      hasValue: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('profile.personal_information_title', 'Información personal')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {fields.map((field, index) => (
            <div
              key={field.labelKey}
              className={`
                flex items-center justify-between py-4
                ${index !== fields.length - 1 ? 'border-b border-gray-200' : ''}
              `}
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {t(field.labelKey, field.labelFallback)}
                </div>
                <div
                  className={`text-base ${
                    field.hasValue ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {field.hasValue
                    ? field.value
                    : t('profile.not_provided', 'No proporcionado')}
                </div>
              </div>
              <div>
                <button
                  className="text-sm text-tp-blue-primary hover:text-tp-blue-primary-hover underline font-medium"
                >
                  {field.hasValue
                    ? t('profile.edit_link', 'Editar')
                    : t('profile.add_link', 'Agregar')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
