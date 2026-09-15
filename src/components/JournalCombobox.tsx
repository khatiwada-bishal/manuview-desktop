"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Check, X, BookOpen, Trash2, ChevronDown, Globe, RefreshCw } from "lucide-react";
import MASTER_JOURNAL_LIST from "@/lib/journal-names.json";
import { JOURNAL_CATALOG } from "@/lib/journals";
import { useJournalScope, JournalScopeProfile } from "@/lib/journal-scope-service";
import { searchJournalsInOpenAlex, OpenAlexSource } from "@/lib/openalex";
export { default as JournalInfoTooltip } from "./JournalInfoTooltip";

interface JournalComboboxProps {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  errorMessage?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showScopeBadge?: boolean;
  onScopeLoaded?: (scope: JournalScopeProfile) => void;
}

const STORAGE_KEY = "manuview_custom_journals";

// Module-level pre-indexed master list for ultra-fast searches across ~49k journals
const PRE_INDEXED_MASTER: { name: string; lower: string }[] = (MASTER_JOURNAL_LIST as string[]).map((name) => ({
  name,
  lower: name.toLowerCase(),
}));
const PRE_INDEXED_MASTER_SET = new Set<string>(PRE_INDEXED_MASTER.map((item) => item.lower));
const CATALOG_SET = new Set<string>(JOURNAL_CATALOG.map((j) => j.name.toLowerCase()));

// Pre-computed default browse list (curated first, followed by all journals in master catalog)
const DEFAULT_BROWSE_LIST: string[] = (() => {
  const curated = JOURNAL_CATALOG.map((j) => j.name);
  const seen = new Set<string>();
  const results: string[] = [];
  for (const j of curated) {
    const l = j.toLowerCase();
    if (!seen.has(l)) {
      seen.add(l);
      results.push(j);
    }
  }
  for (let i = 0; i < PRE_INDEXED_MASTER.length; i++) {
    const item = PRE_INDEXED_MASTER[i];
    if (!seen.has(item.lower)) {
      seen.add(item.lower);
      results.push(item.name);
    }
  }
  return results;
})();

const PAGE_SIZE = 60;

export default function JournalCombobox({
  value,
  onChange,
  hasError = false,
  errorMessage,
  placeholder = "Search or select a journal...",
  className = "",
  inputClassName = "",
  showScopeBadge = false,
  onScopeLoaded,
}: JournalComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customJournals, setCustomJournals] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpwards: boolean;
  }>({ top: 0, left: 0, width: 0, openUpwards: false });

  // Live background journal scope resolution
  const { scope, isLoading: isScopeLoading } = useJournalScope(value || searchQuery);

  // Live OpenAlex Registry Candidates
  const [openAlexResults, setOpenAlexResults] = useState<OpenAlexSource[]>([]);
  const [isOpenAlexLoading, setIsOpenAlexLoading] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setOpenAlexResults([]);
      setIsOpenAlexLoading(false);
      return;
    }

    setIsOpenAlexLoading(true);
    const timer = setTimeout(() => {
      searchJournalsInOpenAlex(q, 6)
        .then((res) => {
          setOpenAlexResults(res);
          setIsOpenAlexLoading(false);
        })
        .catch(() => {
          setOpenAlexResults([]);
          setIsOpenAlexLoading(false);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (scope && onScopeLoaded) {
      onScopeLoaded(scope);
    }
  }, [scope, onScopeLoaded]);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update fixed position based on container input bounding client rect
  const updateCoords = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setDropdownCoords({
      top: openUpwards ? Math.max(8, rect.top - 6) : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      openUpwards,
    });
  }, []);

  // Listen to window resize and scroll events (capture: true catches any nested scrollable parent)
  useEffect(() => {
    if (!isOpen) return;
    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, updateCoords]);

  // Combined master list + custom journals, indexed for speed
  const { allJournals, allJournalsIndexed, journalNameSet } = useMemo(() => {
    if (!customJournals.length) {
      return {
        allJournals: MASTER_JOURNAL_LIST as string[],
        allJournalsIndexed: PRE_INDEXED_MASTER,
        journalNameSet: PRE_INDEXED_MASTER_SET,
      };
    }
    const customIndexed: { name: string; lower: string }[] = [];
    const customSet = new Set<string>();
    for (const c of customJournals) {
      const trimmed = c.trim();
      const lower = trimmed.toLowerCase();
      if (lower && !PRE_INDEXED_MASTER_SET.has(lower) && !customSet.has(lower)) {
        customSet.add(lower);
        customIndexed.push({ name: trimmed, lower });
      }
    }
    const combinedIndexed = [...customIndexed, ...PRE_INDEXED_MASTER];
    const combinedSet = new Set<string>();
    PRE_INDEXED_MASTER_SET.forEach((val) => combinedSet.add(val));
    customSet.forEach((val) => combinedSet.add(val));
    const names = combinedIndexed.map((i) => i.name);
    return {
      allJournals: names,
      allJournalsIndexed: combinedIndexed,
      journalNameSet: combinedSet,
    };
  }, [customJournals]);

  // All matched journals based on search query (immediate listing, prioritized matching)
  const trimmedQuery = searchQuery.trim();
  const queryLower = trimmedQuery.toLowerCase();

  const allMatchedJournals = useMemo(() => {
    if (!queryLower) {
      if (!customJournals.length) {
        return DEFAULT_BROWSE_LIST;
      }
      const seen = new Set<string>();
      const results: string[] = [];
      for (const j of customJournals) {
        const trimmed = j.trim();
        const lower = trimmed.toLowerCase();
        if (lower && !seen.has(lower)) {
          seen.add(lower);
          results.push(trimmed);
        }
      }
      for (let i = 0; i < DEFAULT_BROWSE_LIST.length; i++) {
        const name = DEFAULT_BROWSE_LIST[i];
        const lower = name.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          results.push(name);
        }
      }
      return results;
    }

    const exactMatches: string[] = [];
    const prefixMatches: string[] = [];
    const wordPrefixMatches: string[] = [];
    const containsMatches: string[] = [];

    const spaceQuery = " " + queryLower;
    const dashQuery = "-" + queryLower;
    const colonQuery = ":" + queryLower;

    for (let i = 0; i < allJournalsIndexed.length; i++) {
      const item = allJournalsIndexed[i];
      const lower = item.lower;
      if (lower === queryLower) {
        exactMatches.push(item.name);
      } else if (lower.startsWith(queryLower)) {
        prefixMatches.push(item.name);
      } else if (lower.includes(spaceQuery) || lower.includes(dashQuery) || lower.includes(colonQuery)) {
        wordPrefixMatches.push(item.name);
      } else if (lower.includes(queryLower)) {
        containsMatches.push(item.name);
      }
    }

    return [...exactMatches, ...prefixMatches, ...wordPrefixMatches, ...containsMatches];
  }, [allJournalsIndexed, customJournals, queryLower]);

  // Reset visible count and scroll to top when search query changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setActiveIndex(-1);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [queryLower]);

  // Reset visible count when opening dropdown
  useEffect(() => {
    if (isOpen) {
      setVisibleCount(PAGE_SIZE);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // Visible subset rendered in the DOM for smooth scrolling
  const visibleJournals = useMemo(() => {
    return allMatchedJournals.slice(0, visibleCount);
  }, [allMatchedJournals, visibleCount]);

  // Handle scrolling near bottom to reveal more journals
  const handleListScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (scrollBottom < 250) {
      setVisibleCount((prev) => {
        if (prev < allMatchedJournals.length) {
          return Math.min(prev + PAGE_SIZE, allMatchedJournals.length);
        }
        return prev;
      });
    }
  }, [allMatchedJournals.length]);

  // Determine if typed query is a brand new journal not in the list (O(1) Set lookup)
  const isExactMatch = useMemo(() => {
    if (!trimmedQuery) return true;
    return journalNameSet.has(queryLower);
  }, [journalNameSet, trimmedQuery, queryLower]);

  const canAddNew = trimmedQuery.length > 0 && !isExactMatch;

  // Close dropdown on click outside (checks both input container and portal dropdown)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideContainer = containerRef.current && containerRef.current.contains(target);
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);

      if (!clickedInsideContainer && !clickedInsideDropdown) {
        setIsOpen(false);
        // If user left text without explicitly selecting, keep current value
        setSearchQuery(value || "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Scroll active item into view during keyboard navigation
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  // Handle selecting an existing journal
  const handleSelectJournal = (journalName: string) => {
    onChange(journalName);
    setSearchQuery(journalName);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  // Handle creating & adding a new custom journal
  const handleAddCustomJournal = (nameToAdd?: string) => {
    const name = (nameToAdd || trimmedQuery).trim();
    if (!name) return;

    // Check if not already in custom list
    const lower = name.toLowerCase();
    const alreadyCustom = customJournals.some((j) => j.toLowerCase() === lower);

    if (!alreadyCustom) {
      const updated = [name, ...customJournals];
      setCustomJournals(updated);
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (e) {
        console.warn("Could not save custom journal to localStorage", e);
      }
    }

    onChange(name);
    setSearchQuery(name);
    setIsOpen(false);
    setActiveIndex(-1);

    // Show temporary confirmation toast
    setAddedToast(name);
    setTimeout(() => setAddedToast(null), 3000);
  };

  // Handle deleting a user-added custom journal
  const handleDeleteCustomJournal = (e: React.MouseEvent, journalName: string) => {
    e.stopPropagation();
    const updated = customJournals.filter(
      (j) => j.toLowerCase() !== journalName.toLowerCase()
    );
    setCustomJournals(updated);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("Could not update custom journals in localStorage", err);
    }
    if (value.toLowerCase() === journalName.toLowerCase()) {
      onChange("");
      setSearchQuery("");
    }
  };

  // Clear current selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery(value || "");
      return;
    }

    const totalItems = visibleJournals.length + (canAddNew ? 1 : 0);
    if (totalItems === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeIndex >= visibleJournals.length - 2 && visibleJournals.length < allMatchedJournals.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, allMatchedJournals.length));
      }
      setActiveIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (canAddNew && activeIndex === 0) {
        handleAddCustomJournal();
      } else {
        const itemIdx = canAddNew ? activeIndex - 1 : activeIndex;
        if (itemIdx >= 0 && itemIdx < visibleJournals.length) {
          handleSelectJournal(visibleJournals[itemIdx]);
        } else if (canAddNew) {
          handleAddCustomJournal();
        } else if (visibleJournals.length > 0) {
          handleSelectJournal(visibleJournals[0]);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery(value || "");
    }
  };

  // Check if a journal is user-added custom
  const isCustom = (j: string) => {
    const l = j.toLowerCase();
    return customJournals.some((cj) => cj.toLowerCase() === l);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-expanded={isOpen}
          className={
            inputClassName
              ? `w-full transition font-normal ${inputClassName}`
              : `w-full text-xs px-3.5 pr-16 py-2 rounded-lg transition font-normal ${
                  hasError
                    ? "bg-[#FDF0EF] dark:bg-rose-950/30 border border-[#F7CECC] dark:border-rose-900 text-[#7C2D2B] dark:text-rose-300 placeholder-[#A05E5C] focus:outline-none ring-1 ring-[#F7CECC]"
                    : "bg-white dark:bg-[#161F30] border border-[#EBEBEA] dark:border-[#334155] text-[#2F3437] dark:text-neutral-100 placeholder-[#888888] dark:placeholder-neutral-500 hover:border-[#CCCCCC] dark:hover:border-neutral-500 focus:border-[#0075eb] focus:outline-none focus:ring-2 focus:ring-[#0075eb]/20 shadow-sm"
                }`
          }
        />

        {/* Right Action Buttons */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-[#F0F0EF] dark:hover:bg-white/10 text-[#9B9A97] hover:text-[#2F3437] dark:hover:text-white transition"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1 rounded hover:bg-[#F0F0EF] dark:hover:bg-white/10 text-[#9B9A97] hover:text-[#2F3437] dark:hover:text-white transition"
            title={isOpen ? "Close dropdown" : "Show journal list"}
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Background Fetched Scope Info Badge */}
      {showScopeBadge && Boolean(value) && (
        <div className="mt-1.5 transition-all">
          {isScopeLoading && !scope ? (
            <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 animate-pulse px-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Verifying journal aims &amp; scope in scholarly registry...</span>
            </div>
          ) : scope ? (
            <div className="px-2.5 py-1.5 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15 text-[11px] text-[#334155] dark:text-neutral-200 flex items-start gap-2 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 leading-snug">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[#0F172A] dark:text-white">
                    {scope.publisher ? `${scope.publisher} • ` : ""}{scope.primaryDiscipline}
                  </span>
                  {scope.impactMetric && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                      {scope.impactMetric}
                    </span>
                  )}
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                    {scope.source === "openalex" ? "Live Registry" : scope.source === "catalog" ? "Curated" : "Inferred"}
                  </span>
                </div>
                {scope.keyConcepts.length > 0 && (
                  <div className="text-[10px] text-[#64748B] dark:text-neutral-400 truncate mt-0.5">
                    Topics: {scope.keyConcepts.slice(0, 5).join(", ")}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Success Notification for newly added journal */}
      {addedToast && (
        <div className="absolute top-full left-0 mt-1.5 z-40 bg-[#EBF8F2] dark:bg-emerald-950/40 border border-[#BDEBD6] dark:border-emerald-800 text-[#0F6B43] dark:text-emerald-300 text-[11px] px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5 animate-fadeIn">
          <Check className="w-3 h-3 text-[#0F6B43] dark:text-emerald-400" />
          <span>Added <strong>"{addedToast}"</strong> to your journal list!</span>
        </div>
      )}

      {/* Dropdown Menu rendered via Portal into document.body */}
      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            ...(dropdownCoords.openUpwards
              ? { bottom: `${window.innerHeight - dropdownCoords.top}px` }
              : { top: `${dropdownCoords.top}px` }),
            left: `${dropdownCoords.left}px`,
            width: `${dropdownCoords.width}px`,
            zIndex: 99999,
          }}
          className="bg-white dark:bg-[#161F30] border border-[#EBEBEA] dark:border-[#334155] rounded-xl shadow-2xl overflow-hidden text-xs divide-y divide-[#F7F7F5] dark:divide-[#1F2937] animate-fadeIn"
        >
          {/* Header Info Bar */}
          <div className="px-3 py-1.5 bg-[#FAF9F7] dark:bg-[#0F141F] text-[10px] text-[#787774] dark:text-neutral-400 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <Search className="w-2.5 h-2.5 text-[#9B9A97] dark:text-neutral-500" />
              <span>{allJournals.length.toLocaleString()} catalogued journals</span>
            </span>
            <span>
              {trimmedQuery
                ? `${allMatchedJournals.length.toLocaleString()} match${allMatchedJournals.length === 1 ? "" : "es"}`
                : `${allJournals.length.toLocaleString()} journals`}
              {allMatchedJournals.length > visibleJournals.length && (
                <span className="text-[9px] text-[#9B9A97] dark:text-neutral-500 ml-1">
                  (showing {visibleJournals.length.toLocaleString()})
                </span>
              )}
            </span>
          </div>

          {/* "+ Add New Journal" Action Row if user typed a non-existing journal */}
          {canAddNew && (
            <div
              data-index={0}
              onClick={() => handleAddCustomJournal()}
              className={`px-3 py-2.5 bg-[#F4F9FF] dark:bg-blue-950/40 border-b border-[#E1EFFF] dark:border-blue-900/50 cursor-pointer flex items-center justify-between transition ${
                activeIndex === 0 ? "bg-[#E5F2FF] dark:bg-blue-900/40 text-[#0066CC] dark:text-blue-300" : "hover:bg-[#EBF5FF] dark:hover:bg-blue-900/30 text-[#0075eb] dark:text-blue-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#0075eb] text-white flex items-center justify-center font-bold text-xs">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="font-semibold text-xs text-[#0066CC] dark:text-blue-300">
                    Add "{trimmedQuery}" to list
                  </div>
                  <div className="text-[10px] text-[#0075eb]/70 dark:text-blue-400/70">
                    Not found in catalog — click to save and evaluate rubric
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-[#D0E6FF] dark:bg-blue-900/60 text-[#0055AA] dark:text-blue-200 px-1.5 py-0.5 rounded tracking-wide uppercase">
                New Journal
              </span>
            </div>
          )}

          {/* List of Matching Journals */}
          <div
            ref={listRef}
            onScroll={handleListScroll}
            className="max-h-64 overflow-y-auto divide-y divide-[#F7F7F5] dark:divide-[#1F2937] overscroll-contain"
          >
            {allMatchedJournals.length === 0 && !canAddNew ? (
              <div className="px-4 py-6 text-center text-[#787774] dark:text-neutral-400">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-[#CCCCCC] dark:text-neutral-600" />
                <p className="font-medium text-xs text-[#2F3437] dark:text-neutral-200">No matching journals found</p>
                <p className="text-[11px] text-[#9B9A97] dark:text-neutral-400 mt-1">
                  Type a custom name to create and add a new journal title.
                </p>
              </div>
            ) : (
              <>
                {visibleJournals.map((journal, index) => {
                  const itemDomIndex = canAddNew ? index + 1 : index;
                  const isSelected = value.trim().toLowerCase() === journal.toLowerCase();
                  const isItemActive = activeIndex === itemDomIndex;
                  const isCurated = CATALOG_SET.has(journal.toLowerCase());
                  const isCustomAdded = isCustom(journal);

                  return (
                    <div
                      key={journal}
                      data-index={itemDomIndex}
                      onClick={() => handleSelectJournal(journal)}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between transition ${
                        isSelected
                          ? "bg-[#F7F7F5] dark:bg-[#1E293B] text-[#2F3437] dark:text-white font-semibold"
                          : isItemActive
                          ? "bg-[#FAFAFA] dark:bg-[#1E293B]/60 text-[#2F3437] dark:text-white"
                          : "hover:bg-[#F9F9F8] dark:hover:bg-[#1E293B]/40 text-[#37352F] dark:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            isSelected
                              ? "bg-[#0075eb]"
                              : isCurated
                              ? "bg-[#0F6B43]"
                              : isCustomAdded
                              ? "bg-[#9065B0]"
                              : "bg-[#D3D1CB] dark:bg-neutral-600"
                          }`}
                        />
                        <span className="truncate font-medium text-xs text-[#2F3437] dark:text-neutral-100">
                          {journal}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isCurated && (
                          <span className="text-[9px] font-medium bg-[#EBF8F2] dark:bg-emerald-950/50 text-[#0F6B43] dark:text-emerald-300 border border-[#BDEBD6] dark:border-emerald-800 px-1.5 py-0.5 rounded">
                            Curated
                          </span>
                        )}
                        {isCustomAdded && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-medium bg-[#F6EEFB] dark:bg-purple-950/50 text-[#783CB3] dark:text-purple-300 border border-[#E9D4F7] dark:border-purple-800 px-1.5 py-0.5 rounded">
                              Custom
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomJournal(e, journal)}
                              className="p-1 hover:bg-[#FDF0EF] dark:hover:bg-rose-950/40 text-[#9B9A97] dark:text-neutral-400 hover:text-[#7C2D2B] dark:hover:text-rose-300 rounded transition"
                              title="Remove from custom list"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#0075eb] dark:text-blue-400" />
                        )}
                      </div>
                    </div>
                  );
                })}

                {visibleJournals.length < allMatchedJournals.length && (
                  <div className="py-2.5 px-3 text-center text-[10px] text-[#787774] dark:text-neutral-400 bg-[#FAF9F7]/90 dark:bg-[#0F141F]/70 flex items-center justify-center gap-1.5 font-mono border-t border-[#F0EFEB] dark:border-[#1F2937]">
                    <div className="w-2.5 h-2.5 border-2 border-[#0075eb] border-t-transparent rounded-full animate-spin" />
                    <span>Scroll down to reveal more ({visibleJournals.length.toLocaleString()} of {allMatchedJournals.length.toLocaleString()})</span>
                  </div>
                )}

                {visibleJournals.length >= allMatchedJournals.length && allMatchedJournals.length > PAGE_SIZE && (
                  <div className="py-2 px-3 text-center text-[10px] text-[#9B9A97] dark:text-neutral-500 bg-[#FAF9F7]/40 dark:bg-[#0F141F]/20 font-mono border-t border-[#F0EFEB] dark:border-[#1F2937]">
                    Showing all {allMatchedJournals.length.toLocaleString()} journals
                  </div>
                )}

                {/* OpenAlex Live Registry Candidates */}
                {openAlexResults.length > 0 && (
                  <div className="border-t-2 border-emerald-500/20 dark:border-emerald-500/30 bg-[#F0FDF4]/50 dark:bg-[#062016]/40">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>OpenAlex Global Registry Matches</span>
                      </span>
                      {isOpenAlexLoading && <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-600" />}
                    </div>
                    <div className="divide-y divide-emerald-100/60 dark:divide-emerald-900/30">
                      {openAlexResults.map((oa) => {
                        const isSelected = value.trim().toLowerCase() === oa.displayName.toLowerCase();
                        return (
                          <div
                            key={oa.id}
                            onClick={() => {
                              handleAddCustomJournal(oa.displayName);
                              handleSelectJournal(oa.displayName);
                            }}
                            className="px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-neutral-900 dark:text-white truncate">
                                {oa.displayName}
                              </div>
                              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                {oa.hostOrganization || "Academic Publisher"} {oa.countryCode ? `(${oa.countryCode})` : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {oa.twoYearMeanCitedness !== undefined && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                  2-Yr: {oa.twoYearMeanCitedness.toFixed(1)}
                                </span>
                              )}
                              {oa.isOa && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                  OA
                                </span>
                              )}
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#0075eb] dark:text-blue-400" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Guide / Status */}
          <div className="px-3 py-1.5 bg-[#FAF9F7] dark:bg-[#0F141F] text-[10px] text-[#787774] dark:text-neutral-400 flex items-center justify-between border-t border-[#EBEBEA] dark:border-[#334155]">
            <span>
              Use <kbd className="bg-white dark:bg-neutral-800 border border-[#EBEBEA] dark:border-neutral-700 rounded px-1 py-0.2 font-mono text-[9px] text-neutral-700 dark:text-neutral-300">↑</kbd> <kbd className="bg-white dark:bg-neutral-800 border border-[#EBEBEA] dark:border-neutral-700 rounded px-1 py-0.2 font-mono text-[9px] text-neutral-700 dark:text-neutral-300">↓</kbd> to navigate, <kbd className="bg-white dark:bg-neutral-800 border border-[#EBEBEA] dark:border-neutral-700 rounded px-1 py-0.2 font-mono text-[9px] text-neutral-700 dark:text-neutral-300">Enter</kbd> to pick
            </span>
            {value && (
              <span className="text-[#0F6B43] dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Selected
              </span>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
