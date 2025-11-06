import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-media-query';
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { supabase } from '@/lib/supabaseClient';
import { User } from 'lucide-react';

export default function Layout({ children }) {
  const isMobile = useIsMobile();
  const [userEmail, setUserEmail] = useState('');
  
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
        }
      } catch (error) {
        console.error('Error al obtener el email del usuario:', error);
      }
    };
    
    getUserEmail();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {!isMobile && <Sidebar />}
      {isMobile && <MobileNav />}
      
      <div className={`flex flex-col sm:gap-4 sm:py-4 ${!isMobile ? 'sm:pl-14' : ''}`}>
        {/* Header con email del usuario */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-end h-12 px-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{userEmail || 'Usuario'}</span>
            </div>
          </div>
        </header>
        
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
