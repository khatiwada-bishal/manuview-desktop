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
        <div className="space-y-0.5 max-h-52 overflow-y-auto [scrollbar-width:thin]">
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
                    ? "liquid-glass-tab-active font-semibold text-[#111827] dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isItemActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}
                  />
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
