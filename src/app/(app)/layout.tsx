import { cookies } from 'next/headers';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AppTopBar } from '@/components/AppTopBar';
import { NotificationsProvider } from '@/components/NotificationsProvider';
import { BlogsProvider } from '@/components/BlogsProvider';
import { ChatProvider } from '@/components/ChatProvider';
import { FlashcardsProvider } from '@/components/FlashcardsProvider';
import { ProviderErrorContextProvider } from '@/components/ProviderErrorContext';
import { ProviderErrorBanner } from '@/components/ProviderErrorBanner';
import { RehydrationGate } from '@/lib/store/RehydrationGate';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SidebarProvider saves the collapsed/expanded state in this cookie; read it so a reload keeps it.
  const sidebarOpen = (await cookies()).get('sidebar_state')?.value !== 'false';

  return (
    <RehydrationGate>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar />
        {/* app-pattern: the drifting study-themed background (globals.css) */}
        <SidebarInset className="app-pattern min-w-0">
          <AppTopBar />
          <ProviderErrorContextProvider>
            <NotificationsProvider>
              <BlogsProvider>
                <ChatProvider>
                  <FlashcardsProvider>
                    <ProviderErrorBanner />
                    <main className="flex-1 px-4 py-5 md:px-6 lg:px-8 xl:px-10">
                      <div className="mx-auto w-full max-w-[1500px]">
                        {children}
                      </div>
                    </main>
                  </FlashcardsProvider>
                </ChatProvider>
              </BlogsProvider>
            </NotificationsProvider>
          </ProviderErrorContextProvider>
        </SidebarInset>
      </SidebarProvider>
    </RehydrationGate>
  );
}
