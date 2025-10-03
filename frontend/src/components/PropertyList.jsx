import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bed, Bath, Car, Ruler, Building, Layers, MoreHorizontal, Home, Trees, Building2, Store, Warehouse } from 'lucide-react';
import Metric from "@/components/Metric";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import EditPropertyForm from "@/components/EditPropertyForm";
import PropertyListItem from "@/components/PropertyListItem";
import PropertyDetails from "@/components/PropertyDetails";
import PhotoEditor from "@/components/PhotoEditor";

export default function PropertyList({ properties, promoters, fraccionamientos, onDataChange, view }) {
  const [editingProperty, setEditingProperty] = useState(null);
  const [viewingProperty, setViewingProperty] = useState(null);
  const [editingPhotosProperty, setEditingPhotosProperty] = useState(null);

  const handleSave = (updatedProperty) => {
    onDataChange();
    setEditingProperty(null);
    setEditingPhotosProperty(null);
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
      const { error } = await supabase.from('properties').delete().eq('id', propertyId);
      if (error) {
        console.error('Error deleting property:', error);
      } else {
        onDataChange();
      }
    }
  };

  return (
    <>
      {view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="relative">
              <CardHeader className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 mr-2">
                    {property.property_type === 'casa' && <Home className="h-5 w-5 flex-shrink-0 text-blue-600" />}
                    {property.property_type === 'terreno' && <Trees className="h-5 w-5 flex-shrink-0 text-green-600" />}
                    {property.property_type === 'departamento' && <Building2 className="h-5 w-5 flex-shrink-0 text-purple-600" />}
                    {property.property_type === 'oficina' && <Building className="h-5 w-5 flex-shrink-0 text-gray-600" />}
                    {property.property_type === 'local_comercial' && <Store className="h-5 w-5 flex-shrink-0 text-amber-600" />}
                    {property.property_type === 'bodega' && <Warehouse className="h-5 w-5 flex-shrink-0 text-orange-600" />}
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${property.is_new_property ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {property.is_new_property ? 'Nueva' : 'Usada'}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-base line-clamp-2 h-12 mb-2">
                  {property.title || "Sin Título"}
                </CardTitle>
                <CardDescription as="div">
                  <div className="flex items-baseline">
                    <span className="font-bold text-lg text-primary">
                      {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(property.price || 0)}
                    </span>
                    {/* Mostrar precio por m² según el tipo de propiedad */}
                    {property.property_type === 'terreno' && property.land_area_m2 > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(property.price / property.land_area_m2)}/m² terreno)
                      </span>
                    )}
                    {property.property_type !== 'terreno' && property.construction_area_m2 > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(property.price / property.construction_area_m2)}/m² constr.)
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{property.location_text}</p>
                </CardDescription>
                <div className="mt-3">
                  {property.property_url && (
                    <a href={property.property_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                      <Button size="xs" variant="outline" className="w-full">Ver Anuncio Original</Button>
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <img 
                  src={property.photos?.[0] || 'https://via.placeholder.com/400x300.png?text=Sin+Foto'}
                  alt={property.title}
                  className="rounded-md object-cover h-48 w-full mb-4"
                  referrerPolicy="no-referrer"
                />
                <div className="grid grid-cols-4 gap-y-2 gap-x-4 w-full text-sm text-muted-foreground">
                  {/* Métricas para terrenos */}
                  {property.property_type === 'terreno' ? (
                    <>
                      <Metric icon={<Layers className="w-4 h-4 mr-1" />} value={property.land_area_m2} unit="m² terr." />
                    </>
                  ) : (
                    <>
                      {/* Métricas para propiedades con construcción */}
                      <Metric icon={<Ruler className="w-4 h-4 mr-1" />} value={property.construction_area_m2} unit="m² constr." />
                      <Metric icon={<Layers className="w-4 h-4 mr-1" />} value={property.land_area_m2} unit="m² terr." />
                      
                      {/* Métricas para propiedades residenciales */}
                      {(property.property_type === 'casa' || property.property_type === 'departamento') && (
                        <>
                          <Metric icon={<Bed className="w-4 h-4 mr-1" />} value={property.bedrooms} unit="rec." />
                          <Metric icon={<Building className="w-4 h-4 mr-1" />} value={property.levels} unit="niv." />
                          <Metric icon={<Bath className="w-4 h-4 mr-1" />} value={property.full_bathrooms} unit="baños" />
                          <Metric icon={<Bath className="w-4 h-4 mr-1 opacity-60" />} value={property.half_bathrooms} unit="1/2 baños" />
                          <Metric icon={<Car className="w-4 h-4 mr-1" />} value={property.parking_spaces} unit="estac." />
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start">
                <div className="flex w-full justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><span className="font-semibold">Asesor:</span> {property.promoter_id?.name || "N/A"}</div>
                    <div><span className="font-semibold">Capturado:</span> {new Date(property.created_at).toLocaleDateString('es-MX')}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewingProperty(property)}>Ver Detalles</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingProperty(property)}>
                          Editar Propiedad
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingPhotosProperty(property)}>
                          Editar Fotos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(property.id)} className="text-red-600">
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg bg-card">
          {properties.map((property) => (
            <PropertyListItem 
              key={property.id} 
              property={property} 
              onEdit={setEditingProperty} 
              onDelete={handleDelete} 
              onViewDetails={setViewingProperty}
              onEditPhotos={setEditingPhotosProperty}
            />
          ))}
        </div>
      )}

      {viewingProperty && (
        <Sheet open={!!viewingProperty} onOpenChange={() => setViewingProperty(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{viewingProperty.title}</SheetTitle>
              <SheetDescription>{viewingProperty.location_text}</SheetDescription>
            </SheetHeader>
            {viewingProperty && <PropertyDetails property={viewingProperty} />}
          </SheetContent>
        </Sheet>
      )}

      {editingProperty && (
        <Dialog open={!!editingProperty} onOpenChange={() => setEditingProperty(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Propiedad</DialogTitle>
            </DialogHeader>
            <EditPropertyForm 
              property={editingProperty} 
              promoters={promoters} 
              fraccionamientos={fraccionamientos}
              onSave={handleSave} 
              onCancel={() => setEditingProperty(null)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {editingPhotosProperty && (
        <PhotoEditor 
          key={editingPhotosProperty.id} // Add key to force re-mount
          property={editingPhotosProperty} 
          onSave={handleSave} 
          onCancel={() => setEditingPhotosProperty(null)} 
        />
      )}
    </>
  );
}
