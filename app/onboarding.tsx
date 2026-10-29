import { ProfileForm } from '@/components/ProfileForm';
import { Screen, Title, Txt } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function Onboarding() {
  const { profile } = useAuth();
  if (!profile) return null;
  return (
    <Screen>
      <Title>Cuéntanos de ti</Title>
      <Txt muted>Con esto calculamos tus calorías y macros, y la IA arma tus rutinas y planes.</Txt>
      <ProfileForm initial={profile} />
    </Screen>
  );
}
