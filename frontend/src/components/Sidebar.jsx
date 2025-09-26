import { Home, Users, Map, LineChart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  return (
    <TooltipProvider>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <NavItem to="/" icon={<Home className="h-5 w-5" />} label="Dashboard" />
          <NavItem to="/promoters" icon={<Users className="h-5 w-5" />} label="Promotores" />
          <NavItem to="/map" icon={<Map className="h-5 w-5" />} label="Mapa" />
          <NavItem to="/analysis" icon={<LineChart className="h-5 w-5" />} label="Análisis" />
        </nav>
      </aside>
    </TooltipProvider>
  );
}
