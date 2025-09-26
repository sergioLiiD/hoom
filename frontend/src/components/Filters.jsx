import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

export default function Filters({ filters, setFilters, portals, promoters }) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg bg-card">
      <Select onValueChange={(value) => handleFilterChange('portal', value)} defaultValue={filters.portal}>
        <SelectTrigger>
          <SelectValue placeholder="Portal de Origen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los Portales</SelectItem>
          {portals.map(portal => (
            <SelectItem key={portal} value={portal}>{portal}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={(value) => handleFilterChange('promoter', value)} defaultValue={filters.promoter}>
        <SelectTrigger>
          <SelectValue placeholder="Promotor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los Promotores</SelectItem>
          {promoters.map(promoter => (
            <SelectItem key={promoter.id} value={promoter.id}>{promoter.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        placeholder="Precio Mín."
        value={filters.minPrice}
        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
      />
      <Input
        type="number"
        placeholder="Precio Máx."
        value={filters.maxPrice}
        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
      />
      <DatePicker date={filters.startDate} setDate={(date) => handleFilterChange('startDate', date)} placeholder="Fecha de Inicio" />
      <DatePicker date={filters.endDate} setDate={(date) => handleFilterChange('endDate', date)} placeholder="Fecha de Fin" />
    </div>
  );
}
