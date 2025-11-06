import { Home, Users, Map, LineChart, Trees, Building2, LayoutGrid, Settings, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

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
  const { signOut, isOwner, isAdmin, userRole, user } = useAuth();
  
  console.log('Sidebar - Auth State:', { isOwner, isAdmin, userRole, userId: user?.id });
  
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
          <NavItem to="/config" icon={<Settings className="h-5 w-5 text-gray-600" />} label="Configuración" />
          
          <div className="flex-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
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
