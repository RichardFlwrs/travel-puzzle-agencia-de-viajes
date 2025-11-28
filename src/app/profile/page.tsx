import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Navbar, Footer } from '@/components/layout';
import { ProfileClient } from '@/components/profile';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/profile');
  }

  // Fetch user data from Prisma
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
  });

  if (!user) {
    redirect('/login?callbackUrl=/profile');
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <ProfileClient user={user} />
      </div>
      <Footer />
    </div>
  );
}
