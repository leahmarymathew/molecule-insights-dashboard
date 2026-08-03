import { useState, useRef, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoleculeSearchProps {
  molecules: string[];
  onSelect: (molecule: string) => void;
  placeholder?: string;
}

export function MoleculeSearch({
  molecules,
  onSelect,
  placeholder = "Search molecules…",
}: MoleculeSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return molecules.filter((m) => m.toLowerCase().includes(q)).slice(0, 8);
  }, [molecules, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [matches.length, query]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function choose(molecule: string) {
    onSelect(molecule);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative w-full max-w-xs" ref={containerRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || matches.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(matches[activeIndex]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls="molecule-search-listbox"
          aria-autocomplete="list"
          aria-label="Search molecules"
          className="w-full rounded-md border border-border-strong bg-card py-1.5 pl-8 pr-3 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {open && matches.length > 0 && (
        <ul
          id="molecule-search-listbox"
          role="listbox"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover shadow-md"
        >
          {matches.map((m, i) => (
            <li key={m} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(m)}
                className={cn(
                  "w-full truncate px-3 py-1.5 text-left text-xs text-popover-foreground",
                  i === activeIndex ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
