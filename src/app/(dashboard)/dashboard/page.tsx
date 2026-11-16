import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Clock3,
  Compass,
  GraduationCap,
  Map,
  MapPin,
  Navigation,
  QrCode,
  Route,
  ScanLine,
  Search,
  Layers3,
  Library,
  FlaskConical,
  Landmark,
  ChevronRight,
  LocateFixed,
  BookOpen,
  SearchCheck,
} from "lucide-react";

const statistics = [
  {
    label: "Campus Blocks",
    value: "04",
    description: "Registered campus blocks",
    icon: Building2,
  },
  {
    label: "Floor Levels",
    value: "06",
    description: "Ground to Fifth Floor",
    icon: Layers3,
  },
  {
    label: "Block Floors",
    value: "24",
    description: "Four blocks across six levels",
    icon: Map,
  },
  {
    label: "Directory",
    value: "01",
    description: "Central campus directory",
    icon: Library,
  },
];

const quickActions = [
  {
    title: "Explore Campus",
    description: "Explore campus blocks, map locations and floor selections.",
    icon: Map,
    href: "/campus-map",
    label: "Open campus map",
  },
  {
    title: "Find a Route",
    description: "Choose your starting point and navigate to a destination.",
    icon: Navigation,
    href: "/navigation",
    label: "Start navigation",
  },
  {
    title: "Campus Directory",
    description: "Find blocks, departments, laboratories and facilities.",
    icon: Search,
    href: "/directory",
    label: "Browse directory",
  },
];

const campusBlocks = [
  {
    id: "a-block",
    name: "A-Block",
    description: "Explore floors and available locations.",
    icon: Building2,
  },
  {
    id: "b-block",
    name: "B-Block",
    description: "Explore floors and available locations.",
    icon: Building2,
  },
  {
    id: "c-block",
    name: "C-Block",
    description: "Explore floors and available locations.",
    icon: Building2,
  },
  {
    id: "ai-ml-block",
    name: "AI-ML Block",
    description: "Explore floors and available locations.",
    icon: FlaskConical,
  },
];

const directoryCategories = [
  {
    title: "Academic Departments",
    description: "Browse academic departments and their locations.",
    category: "Departments",
    icon: GraduationCap,
  },
  {
    title: "Laboratories",
    description: "Find practical labs and laboratory locations.",
    category: "Laboratories",
    icon: FlaskConical,
  },
  {
    title: "Campus Facilities",
    description: "Explore facilities and student services.",
    category: "Facilities",
    icon: Landmark,
  },
  {
    title: "Administrative Offices",
    description: "Find university offices and support services.",
    category: "Offices",
    icon: BookOpen,
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Dashboard header */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-xl lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-card">
            <Compass className="size-[18px]" />
          </div>

          <div>
            <span className="block text-sm font-semibold tracking-tight">
              Campus Overview
            </span>
            <span className="hidden text-[10px] text-muted-foreground sm:block">
              Galgotias University
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 sm:flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">
              Campus Navigator
            </span>
          </div>

          <Link
            href="/settings"
            aria-label="Open settings"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold transition-colors hover:bg-accent"
          >
            U
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] space-y-9 p-5 lg:p-8">
        {/* Welcome section */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-medium tracking-wider text-muted-foreground">
              <span>GALGOTIAS UNIVERSITY</span>
              <span>/</span>
              <span className="text-foreground">DASHBOARD</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome to Campus.
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Find your way around campus with interactive maps, location
              discovery and indoor route guidance.
            </p>
          </div>

          <Link
            href="/navigation"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Route className="size-4" />
            Start navigating
            <ArrowUpRight className="size-4" />
          </Link>
        </section>

        {/* Campus statistics */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                Campus at a glance
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Overview of the campus navigation structure.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statistics.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {stat.label}
                    </span>

                    <Icon className="size-[18px] text-muted-foreground" />
                  </div>

                  <div className="mt-5">
                    <p className="text-3xl font-semibold tracking-tight tabular-nums">
                      {stat.value}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-[10px] text-muted-foreground">
            Floor counts represent the configured Ground-to-Fifth floor
            structure, not a count of verified indoor maps.
          </p>
        </section>

        {/* Quick access */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight">
              Quick Access
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your essential campus navigation tools.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  aria-label={action.label}
                  className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-accent/40"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{action.title}</h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {action.description}
                    </p>
                  </div>

                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Campus blocks */}
        <section>
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Explore Campus Blocks
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a block to explore it on the campus map.
              </p>
            </div>

            <Link
              href="/campus-map"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Open full map
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {campusBlocks.map((block) => {
              const Icon = block.icon;

              return (
                <Link
                  key={block.id}
                  href="/campus-map"
                  className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/25 hover:bg-accent/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-background">
                      <Icon className="size-[18px] text-muted-foreground" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>

                  <div className="mt-5">
                    <h3 className="text-sm font-semibold tracking-tight">
                      {block.name}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {block.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Layers3 className="size-3.5" />
                      Ground – Fifth Floor
                    </span>

                    <span className="text-[10px] font-medium text-foreground">
                      Explore
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Main content */}
        <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          {/* Campus map panel */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-sm font-semibold">Campus Map</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  View campus locations and explore the map.
                </p>
              </div>

              <Link
                href="/campus-map"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View map
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-muted/20 p-6">
              {/* Map grid */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />

              <div className="relative flex max-w-sm flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                  <Map className="size-6 text-muted-foreground" />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Interactive Campus Map
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Open the campus map to explore the university, select a
                    block and choose a floor.
                  </p>
                </div>

                <Link
                  href="/campus-map"
                  className="mt-1 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent"
                >
                  Explore campus
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 backdrop-blur">
                <MapPin className="size-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  Galgotias University
                </span>
              </div>

              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 backdrop-blur">
                <LocateFixed className="size-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  GPS supported
                </span>
              </div>
            </div>
          </div>

          {/* Navigation guide */}
          <div className="flex flex-col rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5">
              <h2 className="text-sm font-semibold">Find Your Destination</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Get started with campus navigation.
              </p>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-6 p-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border">
                    <ScanLine className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Identify your location
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Scan a campus QR marker or select your starting point
                      manually.
                    </p>
                  </div>
                </div>

                <div className="ml-4 h-5 border-l border-dashed border-border" />

                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border">
                    <MapPin className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">Choose a destination</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Select a block, department, laboratory, classroom or
                      facility.
                    </p>
                  </div>
                </div>

                <div className="ml-4 h-5 border-l border-dashed border-border" />

                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border">
                    <Navigation className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">Follow your route</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      View available route directions to reach your destination.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/navigation"
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Open navigation
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Directory */}
        <section>
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Campus Directory
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse different categories of campus locations.
              </p>
            </div>

            <Link
              href="/directory"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View directory
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {directoryCategories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.title}
                  href="/directory"
                  className="group flex items-center gap-4 p-4 transition-colors hover:bg-accent/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                    <Icon className="size-[18px] text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{category.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>

                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* QR scanner access */}
        <section className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
              <QrCode className="size-[18px]" />
            </div>

            <div>
              <h2 className="text-sm font-semibold">Campus QR Scanner</h2>
              <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                Scan a QR location marker to identify your position and use it
                as the starting point for navigation.
              </p>
            </div>
          </div>

          <Link
            href="/navigation"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-accent"
          >
            Open QR scanner
            <ArrowUpRight className="size-3.5" />
          </Link>
        </section>

        {/* Footer */}
        <footer className="flex flex-col justify-between gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row">
          <p>Galgotias University · Indoor Campus Navigation System</p>

          <p className="flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            Campus information is subject to verification.
          </p>
        </footer>
      </div>
    </main>
  );
}
