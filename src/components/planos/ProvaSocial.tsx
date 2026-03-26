import { FileCheck2, MapPin } from 'lucide-react';

export function ProvaSocial() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-accent/10 flex items-center justify-center">
          <FileCheck2 className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">1.200+</p>
          <p className="text-sm text-muted-foreground">Declarações processadas</p>
        </div>
      </div>
      <div className="h-10 w-px bg-border hidden sm:block" />
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-accent/10 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">150+</p>
          <p className="text-sm text-muted-foreground">Contadores em todo o Brasil</p>
        </div>
      </div>
    </div>
  );
}
