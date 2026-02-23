import { redirect } from 'next/navigation';

// TODO: Replace with dedicated ProfileScreen when implemented in @innera/app
export default function ProfilePage() {
  redirect('/settings');
}
