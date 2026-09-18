import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { SidebarServiceItem } from "./sidebarUtils";

interface SidebarServicesListProps {
  services: SidebarServiceItem[];
  servicesExpanded: boolean;
  onToggleServicesExpanded: () => void;
  activePaperId: string | null;
}

export function SidebarServicesList({
  services,
  servicesExpanded,
  onToggleServicesExpanded,
  activePaperId,
}: SidebarServicesListProps) {
  const isServiceActive = (serviceId: string) => {
    return activePaperId === `tool-${serviceId}` || activePaperId === serviceId;
  };

  return (
    <div>
      <div className="flex items-center justify-between px-2 mb-1.5">
        <button
          type="button"
          onClick={onToggleServicesExpanded}
          className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 dark:text-neutral-400 uppercase tracking-wider hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
        >
          {servicesExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <span>SERVICES</span>
        </button>
        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-400 bg-black/[0.04] dark:bg-white/[0.08] px-1.5 py-0.2 rounded-md">
          {services.length}
        </span>
      </div>

      {servicesExpanded && (
        <div className="space-y-1 max-h-56 overflow-y-auto [scrollbar-width:thin] pt-1">
          {services.map((service) => {
            const Icon = service.icon;
            const isItemActive = isServiceActive(service.id);
            return (
              <button
                key={service.id}
                type="button"
                onClick={service.action}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer text-left ${
                  isItemActive
                    ? "bg-white dark:bg-white/10 shadow-xs border border-black/[0.06] dark:border-white/[0.08] font-bold text-[#0F172A] dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#0F172A] dark:hover:text-white border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                      service.squircleBg || "bg-blue-500 text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="truncate font-medium">
                    {service.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
