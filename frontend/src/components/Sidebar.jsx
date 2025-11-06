import { useState, useEffect } from "react";
import { Home, Users, Map, LineChart, Trees, Building2, LayoutGrid, Settings, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabaseClient";

const NavItem = ({ to, icon, label }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8 ${
            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          }`
        }
      >
        {icon}
        <span className="sr-only">{label}</span>
      </NavLink>
    </TooltipTrigger>
    <TooltipContent side="right">{label}</TooltipContent>
  </Tooltip>
);

export default function Sidebar() {
  // Estado para verificar si el usuario es owner
  const [isOwner, setIsOwner] = useState(false);
  
  // Verificar si el usuario es owner
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        // Obtener el perfil del usuario
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('role_id')
          .eq('id', user.id)
          .single();
          
        if (profileData && profileData.role_id) {
          // Obtener el nombre del rol
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('name')
            .eq('id', profileData.role_id)
            .single();
            
          // Verificar si el usuario es owner
          setIsOwner(roleData?.name === 'owner');
        }
      } catch (error) {
        console.error('Error al verificar rol:', error);
      }
    };
    
    checkUserRole();
  }, []);
  
  return (
    <TooltipProvider>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <NavItem to="/" icon={<Home className="h-5 w-5" />} label="Dashboard" />
          <NavItem to="/promoters" icon={<Users className="h-5 w-5" />} label="Promotores" />
          <NavItem to="/map" icon={<Map className="h-5 w-5" />} label="Mapa" />
          <NavItem to="/analysis" icon={<Home className="h-5 w-5 text-blue-600" />} label="Casas en Venta" />
          <NavItem to="/land-analysis" icon={<Trees className="h-5 w-5 text-green-600" />} label="Terrenos en Venta" />
          <NavItem to="/rental-analysis" icon={<Building2 className="h-5 w-5 text-purple-600" />} label="Propiedades en Renta" />
          <NavItem to="/fraccionamientos" icon={<LayoutGrid className="h-5 w-5 text-amber-600" />} label="Fraccionamientos" />
          {isOwner && (
            <NavItem to="/config" icon={<Settings className="h-5 w-5 text-gray-600" />} label="Configuración" />
          )}
          
          <div className="flex-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    supabase.auth.signOut().then(() => {
                      window.location.href = '/login';
                    });
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-red-100 hover:text-red-600 text-muted-foreground md:h-8 md:w-8"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Cerrar sesión</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar sesión</TooltipContent>
          </Tooltip>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
