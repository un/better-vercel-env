"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ResponsivePanelLayoutProps {
  main: ReactNode;
  panel: ReactNode;
  panelTitle: string;
  panelDescription?: string;
}

export function ResponsivePanelLayout({
  main,
  panel,
  panelTitle,
  panelDescription,
}: ResponsivePanelLayoutProps) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
      <div className="min-w-0">{main}</div>
      <aside className="hidden rounded-xl border border-border bg-card p-4 lg:block">{panel}</aside>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              Open change panel
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-auto">
            <SheetHeader>
              <SheetTitle>{panelTitle}</SheetTitle>
              {panelDescription ? <SheetDescription>{panelDescription}</SheetDescription> : null}
            </SheetHeader>
            <div className="mt-4">{panel}</div>
          </SheetContent>
        </Sheet>
      </div>
    </section>
  );
}
