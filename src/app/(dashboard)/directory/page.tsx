"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  GraduationCap,
  FlaskConical,
  MapPin,
  ArrowUpRight,
  Layers3,
  SlidersHorizontal,
  X,
  Library,
  BriefcaseBusiness,
  HeartPulse,
  Building,
  ChevronDown,
  MapPinned,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const floors = [
  "Ground Floor",
  "First Floor",
  "Second Floor",
  "Third Floor",
  "Fourth Floor",
  "Fifth Floor",
] as const;

const blocks = [
  {
    id: "a-block",
    name: "A-Block",
    description: "Academic block",
    floors,
  },
  {
    id: "b-block",
    name: "B-Block",
    description: "Academic block",
    floors,
  },
  {
    id: "c-block",
    name: "C-Block",
    description: "Academic block",
    floors,
  },
  {
    id: "ai-ml-block",
    name: "AI-ML Block",
    description: "Academic and technology block",
    floors,
  },
] as const;

const categories = [
  { id: "all", label: "All", icon: Layers3 },
  { id: "blocks", label: "Blocks", icon: Building2 },
  { id: "departments", label: "Departments", icon: GraduationCap },
  { id: "laboratories", label: "Laboratories", icon: FlaskConical },
  { id: "facilities", label: "Facilities", icon: Library },
  { id: "offices", label: "Administrative Offices", icon: BriefcaseBusiness },
  { id: "services", label: "Essential Services", icon: HeartPulse },
] as const;

type Category = (typeof categories)[number]["id"];

type DirectoryItem = {
  id: string;
  name: string;
  category: Exclude<Category, "all">;
  description: string;
  blockId?: string;
  blockName?: string;
  floors?: readonly string[];
  room?: string;
  code?: string;
  icon: LucideIcon;
};

// Only confirmed block names are included here.
// Add departments, laboratories, rooms and facilities
// after their actual locations have been verified.
const directoryItems: DirectoryItem[] = blocks.map((block) => ({
  id: block.id,
  name: block.name,
  category: "blocks",
  description: block.description,
  blockId: block.id,
  blockName: block.name,
  floors: block.floors,
  icon: Building2,
}));

const categoryLabels: Record<Exclude<Category, "all">, string> = {
  blocks: "Block",
  departments: "Department",
  laboratories: "Laboratory",
  facilities: "Facility",
  offices: "Administrative Office",
  services: "Essential Service",
};

const blockOptions = [
  { id: "all", label: "All Blocks" },
  ...blocks.map((block) => ({
    id: block.id,
    label: block.name,
  })),
];

export default function DirectoryPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("all");
  const [selectedFloor, setSelectedFloor] = useState("all");

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return directoryItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;

      const matchesBlock =
        selectedBlock === "all" || item.blockId === selectedBlock;

      const matchesFloor =
        selectedFloor === "all" ||
        item.floors?.includes(selectedFloor) === true;

      const searchableText = [
        item.name,
        item.description,
        item.blockName,
        item.room,
        item.code,
        item.category,
        ...(item.floors ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      return matchesCategory && matchesBlock && matchesFloor && matchesSearch;
    });
  }, [activeCategory, searchQuery, selectedBlock, selectedFloor]);

  const counts = useMemo(() => {
    return {
      all: directoryItems.length,
      blocks: directoryItems.filter((item) => item.category === "blocks")
        .length,
      departments: directoryItems.filter(
        (item) => item.category === "departments",
      ).length,
      laboratories: directoryItems.filter(
        (item) => item.category === "laboratories",
      ).length,
      facilities: directoryItems.filter(
        (item) => item.category === "facilities",
      ).length,
      offices: directoryItems.filter((item) => item.category === "offices")
        .length,
      services: directoryItems.filter((item) => item.category === "services")
        .length,
    };
  }, []);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setSelectedBlock("all");
    setSelectedFloor("all");
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1440px] space-y-8 px-5 py-8 sm:px-8 lg:px-10">
        {/* Page heading */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Campus</span>
              <span>/</span>
              <span className="text-foreground">Directory</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Campus Directory
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Find campus blocks, departments, laboratories, classrooms and
              essential university services.
            </p>
          </div>

          <Link
            href="/campus-map"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            <MapPin className="size-4" />
            View Campus Map
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </Link>
        </section>

        {/* Search */}
        <section className="space-y-5">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search blocks, departments, labs, rooms..."
              aria-label="Search campus directory"
              className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-11 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  aria-pressed={isActive}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {category.label}
                  <span
                    className={`text-[10px] ${
                      isActive
                        ? "text-background/70"
                        : "text-muted-foreground/70"
                    }`}
                  >
                    {counts[category.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Additional filters */}
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-4" />
            Filters
          </div>

          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <select
                value={selectedBlock}
                onChange={(event) => setSelectedBlock(event.target.value)}
                aria-label="Filter by block"
                className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-9 text-xs outline-none focus:border-ring"
              >
                {blockOptions.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.label}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            <div className="relative flex-1">
              <Layers3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <select
                value={selectedFloor}
                onChange={(event) => setSelectedFloor(event.target.value)}
                aria-label="Filter by floor"
                className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-9 text-xs outline-none focus:border-ring"
              >
                <option value="all">All Floors</option>
                {floors.map((floor) => (
                  <option key={floor} value={floor}>
                    {floor}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {(selectedBlock !== "all" ||
            selectedFloor !== "all" ||
            activeCategory !== "all" ||
            searchQuery) && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 shrink-0 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </section>

        {/* Directory results */}
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-sm font-semibold">Directory listings</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {filteredItems.length}{" "}
                {filteredItems.length === 1 ? "result" : "results"} found
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPinned className="size-3.5" />
              <span>Campus locations</span>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.id}
                    className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/25"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted/50">
                        <Icon
                          className="size-[19px] text-foreground/80"
                          strokeWidth={1.7}
                        />
                      </div>

                      <span className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground">
                        {categoryLabels[item.category]}
                      </span>
                    </div>

                    <div className="mt-5">
                      <h3 className="text-base font-semibold tracking-tight">
                        {item.name}
                      </h3>

                      <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-5 space-y-3 border-t border-border pt-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building className="size-3.5 shrink-0" />
                        <span>{item.blockName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Layers3 className="size-3.5 shrink-0" />
                        <span>
                          {item.floors?.length
                            ? `${item.floors.length} floors · Ground to Fifth`
                            : (item.floors?.[0] ?? "Floor not specified")}
                        </span>
                      </div>
                    </div>

                    {item.floors && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {item.floors.map((floor) => (
                          <span
                            key={floor}
                            className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground"
                          >
                            {floor.replace(" Floor", "")}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {item.id.toUpperCase()}
                      </span>

                      <Link
                        href="/campus-map"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground transition-colors hover:text-muted-foreground"
                      >
                        View on map
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border px-5 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Search className="size-5 text-muted-foreground" />
              </div>

              <h3 className="mt-4 text-sm font-semibold">
                {searchQuery ||
                selectedBlock !== "all" ||
                selectedFloor !== "all"
                  ? "No results found"
                  : "No listings available"}
              </h3>

              <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
                {searchQuery ||
                selectedBlock !== "all" ||
                selectedFloor !== "all"
                  ? "Try changing your search or filters to find what you are looking for."
                  : `There are no ${activeCategory === "all" ? "directory" : categories.find((category) => category.id === activeCategory)?.label.toLowerCase()} entries available yet. Verified locations can be added to this category.`}
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Block overview */}
        {activeCategory === "all" || activeCategory === "blocks" ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Explore by block</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Browse the campus blocks and their available floors.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory("blocks");
                    setSelectedBlock(block.id);
                    setSelectedFloor("all");
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/25 hover:bg-accent/30"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="size-[18px] text-foreground/80" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{block.name}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Ground – Fifth Floor
                    </p>
                  </div>

                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
