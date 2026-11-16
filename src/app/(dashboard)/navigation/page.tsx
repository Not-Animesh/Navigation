"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Html5Qrcode as Html5QrcodeInstance } from "html5-qrcode";
import Link from "next/link";

import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Footprints,
  Info,
  Layers3,
  MapPin,
  Navigation,
  QrCode,
  Route,
  ScanLine,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  buildings,
  campusCenter,
  type Coordinate,
} from "@/lib/campus/buildings";

import { importLibrary } from "@/lib/google-maps-loader";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type LocationNode = {
  id: string;
  name: string;
  building: string;
  floor: string;
  category: string;
};

type GraphEdge = {
  from: string;
  to: string;
  distance: number;
  instruction: string;
};

type RouteResult = {
  path: LocationNode[];
  distance: number;
  instructions: string[];
};

// --------------------------------------------------
// LOCATION DATA
// --------------------------------------------------

const locations: LocationNode[] = [
  {
    id: "main-entrance",
    name: "Main Entrance",
    building: "Campus Entrance",
    floor: "Ground Floor",
    category: "Entrance",
  },
  {
    id: "building-01-lobby",
    name: "Building 01 Lobby",
    building: "Building 01",
    floor: "Ground Floor",
    category: "Lobby",
  },
  {
    id: "corridor-a",
    name: "Central Corridor",
    building: "Building 01",
    floor: "Ground Floor",
    category: "Corridor",
  },
  {
    id: "room-101",
    name: "Room 101",
    building: "Building 01",
    floor: "Ground Floor",
    category: "Classroom",
  },
  {
    id: "stairs-a",
    name: "Staircase A",
    building: "Building 01",
    floor: "Ground Floor",
    category: "Stairs",
  },
  {
    id: "first-floor-corridor",
    name: "First Floor Corridor",
    building: "Building 01",
    floor: "First Floor",
    category: "Corridor",
  },
  {
    id: "lab-201",
    name: "Laboratory 201",
    building: "Building 01",
    floor: "First Floor",
    category: "Laboratory",
  },
];

// --------------------------------------------------
// NAVIGATION GRAPH
// --------------------------------------------------

const graphEdges: GraphEdge[] = [
  {
    from: "main-entrance",
    to: "building-01-lobby",
    distance: 35,
    instruction: "Walk straight towards Building 01.",
  },
  {
    from: "building-01-lobby",
    to: "corridor-a",
    distance: 12,
    instruction: "Enter the building and continue into the central corridor.",
  },
  {
    from: "corridor-a",
    to: "room-101",
    distance: 18,
    instruction: "Turn towards Room 101.",
  },
  {
    from: "corridor-a",
    to: "stairs-a",
    distance: 15,
    instruction: "Continue towards Staircase A.",
  },
  {
    from: "stairs-a",
    to: "first-floor-corridor",
    distance: 12,
    instruction: "Use Staircase A to reach the first floor.",
  },
  {
    from: "first-floor-corridor",
    to: "lab-201",
    distance: 20,
    instruction: "Follow the first-floor corridor to Laboratory 201.",
  },
];

// --------------------------------------------------
// DIJKSTRA SHORTEST-PATH ALGORITHM
// --------------------------------------------------

function findShortestRoute(
  startId: string,
  destinationId: string,
): RouteResult | null {
  if (startId === destinationId) {
    return null;
  }

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};

  const unvisited = new Set(locations.map((location) => location.id));

  locations.forEach((location) => {
    distances[location.id] = Infinity;
    previous[location.id] = null;
  });

  distances[startId] = 0;

  while (unvisited.size > 0) {
    let current: string | null = null;
    let shortestDistance = Infinity;

    for (const id of unvisited) {
      if (distances[id] < shortestDistance) {
        shortestDistance = distances[id];
        current = id;
      }
    }

    if (current === null || shortestDistance === Infinity) {
      break;
    }

    if (current === destinationId) {
      break;
    }

    unvisited.delete(current);

    const connectedEdges = graphEdges.filter(
      (edge) => edge.from === current || edge.to === current,
    );

    for (const edge of connectedEdges) {
      const neighbour = edge.from === current ? edge.to : edge.from;

      if (!unvisited.has(neighbour)) continue;

      const newDistance = distances[current] + edge.distance;

      if (newDistance < distances[neighbour]) {
        distances[neighbour] = newDistance;
        previous[neighbour] = current;
      }
    }
  }

  if (distances[destinationId] === Infinity) {
    return null;
  }

  const pathIds: string[] = [];
  let current: string | null = destinationId;

  while (current !== null) {
    pathIds.unshift(current);
    current = previous[current];
  }

  const path = pathIds
    .map((id) => locations.find((location) => location.id === id))
    .filter((location): location is LocationNode => Boolean(location));

  const instructions = pathIds.slice(0, -1).map((id, index) => {
    const nextId = pathIds[index + 1];

    const edge = graphEdges.find(
      (item) =>
        (item.from === id && item.to === nextId) ||
        (item.from === nextId && item.to === id),
    );

    return edge?.instruction ?? "Continue along the route.";
  });

  return {
    path,
    distance: distances[destinationId],
    instructions,
  };
}

// --------------------------------------------------
// CAMPUS GOOGLE MAP
// --------------------------------------------------

function NavigationCampusMap({
  userPosition,
}: {
  userPosition: Coordinate | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<google.maps.Map | null>(null);

  const markersRef = useRef<google.maps.Marker[]>([]);

  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  // Initialize the map once.
  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      try {
        const { Map } = (await importLibrary(
          "maps",
        )) as google.maps.MapsLibrary;

        const { Marker } = (await importLibrary(
          "marker",
        )) as google.maps.MarkerLibrary;

        if (cancelled || !containerRef.current) return;

        const map = new Map(containerRef.current, {
          center: campusCenter,
          zoom: 17,
          mapTypeId: "hybrid",
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });

        mapRef.current = map;

        const markers: google.maps.Marker[] = [];

        buildings.forEach((building) => {
          if (!building.coordinate) return;

          const marker = new Marker({
            map,
            position: building.coordinate,
            title: building.name,
            clickable: false,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#171717",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 9,
            },
            label: {
              text: building.name,
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "12px",
            },
          });

          markers.push(marker);
        });

        if (cancelled) {
          markers.forEach((marker) => marker.setMap(null));
          return;
        }

        markersRef.current = markers;

        setMapStatus("ready");
      } catch (error) {
        console.error("Campus map initialization failed:", error);

        if (!cancelled) {
          setMapStatus("error");
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;

      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });

      markersRef.current = [];

      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;

      mapRef.current = null;
    };
  }, []);

  // Update the user's location marker.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || mapStatus !== "ready" || !userPosition) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        map,
        position: userPosition,
        title: "Your location",
        zIndex: 1000,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
          scale: 9,
        },
      });
    } else {
      userMarkerRef.current.setPosition(userPosition);
    }
  }, [userPosition, mapStatus]);

  return (
    <div className="relative h-[420px] w-full bg-muted sm:h-[540px]">
      <div ref={containerRef} className="size-full" />

      {mapStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
          <div className="text-center">
            <div className="mx-auto size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />

            <p className="mt-3 text-xs text-muted-foreground">
              Loading campus map...
            </p>
          </div>
        </div>
      )}

      {mapStatus === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background p-6 text-center">
          <div>
            <MapPin className="mx-auto size-7 text-muted-foreground" />

            <p className="mt-3 text-sm font-semibold">
              Unable to load campus map
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Check your Google Maps API configuration.
            </p>
          </div>
        </div>
      )}

      {mapStatus === "ready" && (
        <div className="absolute bottom-3 left-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
          <div className="flex items-center gap-3 text-[10px] text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-900" />
              Buildings
            </span>

            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-600" />
              Your location
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// MAIN PAGE
// --------------------------------------------------

export default function NavigationPage() {
  // Location selection
  const [startId, setStartId] = useState("main-entrance");

  const [destinationId, setDestinationId] = useState("lab-201");

  // Route state
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  const [routeAttempted, setRouteAttempted] = useState(false);

  // GPS state
  const [userPosition, setUserPosition] = useState<Coordinate | null>(null);

  const [locationMessage, setLocationMessage] = useState("");

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);

  const [scannerError, setScannerError] = useState("");

  const [scannerLoading, setScannerLoading] = useState(false);

  const [scanMessage, setScanMessage] = useState("");

  const scannerRef = useRef<Html5QrcodeInstance | null>(null);

  const scanHandledRef = useRef(false);

  // ------------------------------------------------
  // SELECTED LOCATIONS
  // ------------------------------------------------

  const startLocation = locations.find((location) => location.id === startId);

  const destination = locations.find(
    (location) => location.id === destinationId,
  );

  // ------------------------------------------------
  // ROUTE SUMMARY
  // ------------------------------------------------

  const estimatedMinutes = routeResult
    ? Math.max(1, Math.ceil(routeResult.distance / 75))
    : 0;

  const routeFloors = useMemo(() => {
    if (!routeResult) return [];

    return [...new Set(routeResult.path.map((point) => point.floor))];
  }, [routeResult]);

  // ------------------------------------------------
  // GPS LOCATION
  // ------------------------------------------------

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser.");
      return;
    }

    setLocationMessage("Finding your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setLocationMessage(
          `Location updated · Accuracy ±${Math.round(
            position.coords.accuracy,
          )} m`,
        );
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Location permission was denied.",
          2: "Your location is unavailable.",
          3: "Location request timed out.",
        };

        setLocationMessage(
          messages[error.code] ?? "Unable to retrieve your location.",
        );
      },
      {
        enableHighAccuracy: false,
        maximumAge: 15000,
        timeout: 10000,
      },
    );
  }, []);

  // ------------------------------------------------
  // ROUTE CALCULATION
  // ------------------------------------------------

  const handleFindRoute = () => {
    setRouteAttempted(true);

    const result = findShortestRoute(startId, destinationId);

    setRouteResult(result);
  };

  const handleSwapLocations = () => {
    setStartId(destinationId);
    setDestinationId(startId);

    setRouteResult(null);
    setRouteAttempted(false);
  };

  const handleStartChange = (value: string) => {
    setStartId(value);
    setRouteResult(null);
    setRouteAttempted(false);
  };

  const handleDestinationChange = (value: string) => {
    setDestinationId(value);
    setRouteResult(null);
    setRouteAttempted(false);
  };

  // ------------------------------------------------
  // QR CODE RESULT HANDLER
  // ------------------------------------------------

  const handleQrResult = useCallback((decodedText: string) => {
    if (scanHandledRef.current) return;

    let locationId = decodedText.trim();

    try {
      const parsed = JSON.parse(decodedText);

      if (
        parsed?.type === "campus-location" &&
        typeof parsed.locationId === "string"
      ) {
        locationId = parsed.locationId;
      }
    } catch {
      // Plain-text QR format is also supported.
    }

    if (locationId.startsWith("GU-NAV:")) {
      locationId = locationId.replace("GU-NAV:", "");
    }

    const matchedLocation = locations.find(
      (location) => location.id === locationId,
    );

    if (!matchedLocation) {
      setScannerError("This QR code does not match a registered location.");
      return;
    }

    scanHandledRef.current = true;

    setStartId(matchedLocation.id);

    setRouteResult(null);
    setRouteAttempted(false);

    setScannerError("");

    setScanMessage(`Starting point set to ${matchedLocation.name}.`);

    setScannerOpen(false);
  }, []);

  // ------------------------------------------------
  // QR SCANNER LIFECYCLE
  // ------------------------------------------------

  useEffect(() => {
    if (!scannerOpen) return;

    let cancelled = false;

    async function startScanner() {
      try {
        setScannerLoading(true);
        setScannerError("");

        scanHandledRef.current = false;

        const { Html5Qrcode } = await import("html5-qrcode");

        if (cancelled) return;

        const scanner = new Html5Qrcode("qr-reader");

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 220,
              height: 220,
            },
          },
          (decodedText) => {
            if (!cancelled) {
              handleQrResult(decodedText);
            }
          },
          () => {
            // Ignore unsuccessful frame scans.
          },
        );

        if (!cancelled) {
          setScannerLoading(false);
        }
      } catch {
        if (!cancelled) {
          setScannerLoading(false);

          setScannerError(
            "Unable to access the camera. Check camera permissions or use manual location selection.",
          );
        }
      }
    }

    void startScanner();

    return () => {
      cancelled = true;

      const scanner = scannerRef.current;

      scannerRef.current = null;

      if (scanner) {
        scanner
          .stop()
          .catch(() => {
            // Scanner may not have started successfully.
          })
          .finally(() => {
            scanner.clear();
          });
      }
    };
  }, [scannerOpen, handleQrResult]);

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <main className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-5 backdrop-blur-xl lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg border bg-card">
            <Navigation className="size-4" />
          </div>

          <div>
            <p className="text-sm font-semibold tracking-tight">Navigation</p>

            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Indoor route planner
            </p>
          </div>
        </div>

        <Link
          href="/campus-map"
          className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors hover:bg-accent"
        >
          <MapPin className="size-3.5" />
          <span className="hidden sm:inline">Campus Map</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </header>

      <div className="mx-auto max-w-[1440px] space-y-7 p-5 lg:p-8">
        {/* PAGE HEADING */}
        <section>
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>

            <span>/</span>

            <span className="text-foreground">Navigation</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Find Your Way
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Select your starting location and destination to find an indoor
            route across campus.
          </p>
        </section>

        {/* LOCATION SELECTOR */}
        <section className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <Route className="size-4 text-muted-foreground" />

              <h2 className="text-sm font-semibold">Plan your journey</h2>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Where are you starting, and where do you want to go?
            </p>
          </div>

          <div className="space-y-5 p-5">
            {/* START LOCATION */}
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2">
                <label
                  htmlFor="start-location"
                  className="flex items-center gap-2 text-xs font-medium"
                >
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Starting location
                </label>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <select
                    id="start-location"
                    value={startId}
                    onChange={(event) => handleStartChange(event.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border bg-background pl-10 pr-10 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
                  >
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} — {location.building}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {startLocation?.floor} · {startLocation?.category}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setScannerError("");
                  setScanMessage("");
                  setScannerOpen(true);
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-accent"
              >
                <ScanLine className="size-4" />
                Scan QR Code
              </button>
            </div>

            {/* SWAP LOCATIONS */}
            <div className="relative flex items-center">
              <div className="h-px flex-1 border-t border-dashed" />

              <button
                type="button"
                onClick={handleSwapLocations}
                className="mx-3 flex size-8 items-center justify-center rounded-full border bg-background transition-colors hover:bg-accent"
                title="Swap locations"
                aria-label="Swap starting location and destination"
              >
                <ArrowDown className="size-3.5" />
              </button>

              <div className="h-px flex-1 border-t border-dashed" />
            </div>

            {/* DESTINATION */}
            <div className="space-y-2">
              <label
                htmlFor="destination-location"
                className="flex items-center gap-2 text-xs font-medium"
              >
                <span className="size-2 rounded-full bg-primary" />
                Destination
              </label>

              <div className="relative">
                <Navigation className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <select
                  id="destination-location"
                  value={destinationId}
                  onChange={(event) =>
                    handleDestinationChange(event.target.value)
                  }
                  className="h-11 w-full appearance-none rounded-lg border bg-background pl-10 pr-10 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
                >
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} — {location.building}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <p className="text-[11px] text-muted-foreground">
                {destination?.floor} · {destination?.category}
              </p>
            </div>

            {/* FIND ROUTE */}
            <button
              type="button"
              onClick={handleFindRoute}
              disabled={startId === destinationId}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Route className="size-4" />
              Find Shortest Route
              <ArrowRight className="size-4" />
            </button>

            {startId === destinationId && (
              <p className="text-center text-xs text-muted-foreground">
                Choose two different locations to calculate a route.
              </p>
            )}
          </div>
        </section>

        {/* CAMPUS MAP */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <MapPin className="size-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">Campus Map</h2>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Explore the university and its buildings.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {locationMessage && (
                <span className="text-[11px] text-muted-foreground">
                  {locationMessage}
                </span>
              )}

              <button
                type="button"
                onClick={handleLocateMe}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-accent"
              >
                <Navigation className="size-3.5" />
                Locate me
              </button>

              <Link
                href="/campus-map"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
              >
                Full map
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <NavigationCampusMap userPosition={userPosition} />
        </section>

        {/* QR SCANNER */}
        {scannerOpen && (
          <section className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <QrCode className="size-4" />

                <h2 className="text-sm font-semibold">Scan location QR code</h2>
              </div>

              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
                aria-label="Close QR scanner"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="mx-auto max-w-md">
                <div
                  id="qr-reader"
                  className="overflow-hidden rounded-lg border bg-background"
                />

                {scannerLoading && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Starting camera...
                  </p>
                )}

                {scannerError && (
                  <p className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                    {scannerError}
                  </p>
                )}

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Point your camera towards a registered campus QR marker.
                  Camera access generally requires HTTPS or localhost.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* QR SUCCESS MESSAGE */}
        {scanMessage && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <Check className="size-4 text-emerald-500" />

            <p className="text-sm">{scanMessage}</p>

            <button
              type="button"
              onClick={() => setScanMessage("")}
              className="ml-auto text-muted-foreground hover:text-foreground"
              aria-label="Dismiss message"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* ROUTE RESULTS */}
        {routeResult && (
          <section className="overflow-hidden rounded-xl border bg-card">
            {/* ROUTE SUMMARY HEADER */}
            <div className="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-500" />

                  <h2 className="text-sm font-semibold">Route found</h2>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Your route directions.
                </p>
              </div>

              <div className="flex gap-5">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {routeResult.distance}m
                  </p>

                  <p className="text-[11px] text-muted-foreground">Distance</p>
                </div>

                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {estimatedMinutes} min
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    Estimated walk
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {routeResult.path.length - 1}
                  </p>

                  <p className="text-[11px] text-muted-foreground">Segments</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
              {/* ROUTE STEPS */}
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Route directions
                </h3>

                <div className="space-y-0">
                  {routeResult.path.map((point, index) => {
                    const isStart = index === 0;

                    const isEnd = index === routeResult.path.length - 1;

                    return (
                      <div key={point.id} className="relative flex gap-4">
                        <div className="flex w-8 shrink-0 flex-col items-center">
                          <div
                            className={`z-10 flex size-8 items-center justify-center rounded-full border ${
                              isStart
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                : isEnd
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "bg-background text-muted-foreground"
                            }`}
                          >
                            {isStart ? (
                              <MapPin className="size-4" />
                            ) : isEnd ? (
                              <Navigation className="size-4" />
                            ) : (
                              <span className="text-xs font-semibold">
                                {index}
                              </span>
                            )}
                          </div>

                          {index < routeResult.path.length - 1 && (
                            <div className="my-1 min-h-8 w-px flex-1 border-l border-dashed" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pb-5">
                          <p className="text-sm font-medium">{point.name}</p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {point.building} · {point.floor}
                          </p>

                          {index < routeResult.instructions.length && (
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              {routeResult.instructions[index]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ROUTE DETAILS */}
              <aside className="h-fit rounded-xl border bg-muted/20 p-4">
                <h3 className="text-xs font-semibold">Journey summary</h3>

                <div className="mt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 text-emerald-500" />

                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Starting point
                      </p>

                      <p className="mt-1 text-xs font-medium">
                        {startLocation?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Navigation className="mt-0.5 size-4" />

                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Destination
                      </p>

                      <p className="mt-1 text-xs font-medium">
                        {destination?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Layers3 className="mt-0.5 size-4 text-muted-foreground" />

                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Floors involved
                      </p>

                      <p className="mt-1 text-xs font-medium">
                        {routeFloors.length}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Footprints className="mt-0.5 size-4 text-muted-foreground" />

                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Walking distance
                      </p>

                      <p className="mt-1 text-xs font-medium">
                        {routeResult.distance} metres
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/campus-map"
                  className="mt-5 flex h-9 items-center justify-center gap-2 rounded-lg border bg-background text-xs font-medium transition-colors hover:bg-accent"
                >
                  View campus map
                  <ArrowRight className="size-3.5" />
                </Link>
              </aside>
            </div>
          </section>
        )}

        {/* NO ROUTE */}
        {routeAttempted && !routeResult && startId !== destinationId && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-amber-500" />

              <p className="text-sm font-medium">No route available</p>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              No connected path exists between these locations. Check the
              available route connections.
            </p>
          </div>
        )}

        {/* FOOTER */}
        <footer className="flex flex-col justify-between gap-2 border-t pt-5 text-xs text-muted-foreground sm:flex-row">
          <p>Galgotias University · Indoor Navigation</p>

          <p className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            QR-based location identification
          </p>
        </footer>
      </div>
    </main>
  );
}
