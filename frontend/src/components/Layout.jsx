import { useIsMobile } from '@/hooks/use-media-query';
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function Layout({ children }) {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {!isMobile && <Sidebar />}
      {isMobile && <MobileNav />}
      
      <div className={`flex flex-col sm:gap-4 sm:py-4 ${!isMobile ? 'sm:pl-14' : ''}`}>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
