import { router } from 'expo-router';

import { ProfileForm } from '@/components/ProfileForm';
import { Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function EditProfile() {
  const { profile } = useAuth();
  if (!profile) return null;
  return (
    <Screen>
      <ProfileForm initial={profile} onSaved={() => router.back()} />
    </Screen>
  );
}
