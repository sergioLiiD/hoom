import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Verificar si estamos en el navegador
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Actualizar el estado inicial
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      
      // Escuchar cambios en la consulta de medios
      const listener = (e) => setMatches(e.matches);
      media.addEventListener('change', listener);
      
      // Limpiar el listener al desmontar
      return () => media.removeEventListener('change', listener);
    }
  }, [matches, query]);

  return matches;
}

// Hook predefinido para pantallas móviles
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

// Hook predefinido para pantallas de tableta
export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

// Hook predefinido para pantallas de escritorio
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}
