import { GetServerSideProps } from 'next';
import RealtimeExcel from '@/components/excel/ExcelSheet';
import UploadSheet from '@/components/excel/UploadSheet';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import prisma from '@/utils/prisma';

interface SheetPageProps {
  sheet: {
    id: string;
    title: string;
    companyId: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default async function SheetPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/error?message=Unauthorized');
  }

  const sheet = await prisma.sheet.findUnique({
    where: {
      companyId: user.id,
    },
    include: {
      company: true,
    },
  });

  if (!sheet) {
    return (
      <div className="h-screen flex flex-col">
        <header className="bg-white border-b p-4">
          <h1 className="text-2xl font-bold">Upload Sheet</h1>
        </header>
        <main className="flex-1">
          <UploadSheet companyId={user.id} />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold">{sheet.title}</h1>
      </header>

      <main className="flex-1">
        <RealtimeExcel
          sheetId={sheet.id}
          userId={user.id}
          userName={`${sheet.company.companyName}`}
          companyId={sheet.companyId}
        />
      </main>
    </div>
  );
}
