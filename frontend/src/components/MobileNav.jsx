import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Inicio', path: '/' },
  { name: 'Análisis', path: '/analysis' },
  { name: 'Terrenos', path: '/land-analysis' },
  { name: 'Renta', path: '/rental-analysis' },
  { name: 'Mapa', path: '/map' },
  { name: 'Configuración', path: '/config' },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { signOut, isOwner, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar el menú cuando cambia la ruta
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Botón del menú hamburguesa */}
      <div className={cn(
        "fixed top-4 right-4 z-50 transition-all duration-300",
        isScrolled ? "scale-90" : "scale-100"
      )}>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Menú desplegable */}
      <div className={cn(
        "fixed inset-0 z-40 bg-white/95 backdrop-blur-sm transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full pt-20 px-6 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "text-xl font-medium px-4 py-3 rounded-lg transition-colors",
                location.pathname === item.path 
                  ? "bg-primary text-white" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.name}
            </Link>
          ))}
          
          <div className="flex-1 min-h-[40px]" />
          
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 border-red-200"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </>
  );
}
