import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AppTopBar } from '@/components/AppTopBar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(240,253,244,0.9)_26%,_rgba(236,253,245,0.84)_100%)] md:pl-[calc(14.5rem+1rem)] md:peer-data-[state=collapsed]:pl-[calc(3.5rem+1rem)] lg:pl-[calc(14.5rem+1.25rem)] lg:peer-data-[state=collapsed]:pl-[calc(3.5rem+1.25rem)]">
        <AppTopBar />
        <main className="flex-1 px-4 py-5 md:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1500px]">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
