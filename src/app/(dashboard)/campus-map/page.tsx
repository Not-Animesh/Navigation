/// <reference types="google.maps" />

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Crosshair,
  LocateFixed,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  buildings,
  campusCenter,
  floors,
  type BuildingId,
  type Coordinate,
  type FloorId,
} from "@/lib/campus/buildings";

import { importLibrary } from "@/lib/google-maps-loader";

type UserPosition = Coordinate & { accuracy: number };
type MapStatus = "loading" | "ready" | "error";
type RouteStatus = "idle" | "calculating" | "success" | "error";
type PinOverrides = Partial<Record<BuildingId, Coordinate>>;
type CustomPin = { id: string; name: string; lat: number; lng: number };
type PlaceOption = {
  id: string;
  name: string;
  coordinate: Coordinate;
  kind: "gps" | "building" | "custom";
};

type PinDialog =
  | { type: "add"; coordinate: Coordinate }
  | { type: "rename"; pin: CustomPin }
  | { type: "delete"; pin: CustomPin }
  | { type: "reset" }
  | null;

const INITIAL_ZOOM = 17;
const CUSTOM_PINS_KEY = "gu-campus-custom-pins-v1";
const BUILDING_OVERRIDES_KEY = "gu-campus-building-overrides-v1";

function getBuildingCoordinate(
  id: BuildingId,
  overrides: PinOverrides,
): Coordinate | null {
  return (
    overrides[id] ??
    buildings.find((item) => item.id === id)?.coordinate ??
    null
  );
}

function MapToolbar({
  selectedBuilding,
  selectedFloor,
  onBuildingChange,
  onFloorChange,
}: {
  selectedBuilding: BuildingId | null;
  selectedFloor: FloorId;
  onBuildingChange: (id: BuildingId | null) => void;
  onFloorChange: (id: FloorId) => void;
}) {
  const activeBuilding = buildings.find((item) => item.id === selectedBuilding);

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <select
            value={selectedBuilding ?? "campus"}
            onChange={(event) =>
              onBuildingChange(
                event.target.value === "campus"
                  ? null
                  : (event.target.value as BuildingId),
              )
            }
            className="h-10 min-w-48 appearance-none rounded-lg border border-border bg-background pl-10 pr-10 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="campus">University Map</option>

            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1">
          {floors.map((floor) => (
            <button
              key={floor.id}
              type="button"
              disabled={!selectedBuilding}
              onClick={() => onFloorChange(floor.id)}
              className={`h-8 shrink-0 rounded-md px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selectedFloor === floor.id && selectedBuilding
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {floor.shortLabel} · {floor.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {activeBuilding
          ? `${activeBuilding.name} / ${
              floors.find((item) => item.id === selectedFloor)?.label
            }`
          : "University / Campus Overview"}
      </p>
    </section>
  );
}

function GoogleCampusMap({
  userPosition,
  pinOverrides,
  customPins,
  adjustPins,
  addPinMode,
  onBuildingPinChange,
  onCustomPinMove,
  onAddCustomPin,
  onStatusChange,
  onMapReady,
}: {
  userPosition: UserPosition | null;
  pinOverrides: PinOverrides;
  customPins: CustomPin[];
  adjustPins: boolean;
  addPinMode: boolean;
  onBuildingPinChange: (id: BuildingId, coordinate: Coordinate) => void;
  onCustomPinMove: (id: string, coordinate: Coordinate) => void;
  onAddCustomPin: (coordinate: Coordinate) => void;
  onStatusChange: (status: MapStatus) => void;
  onMapReady: (map: google.maps.Map) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const buildingMarkersRef = useRef<
    Partial<Record<BuildingId, google.maps.Marker>>
  >({});

  const customMarkersRef = useRef<Record<string, google.maps.Marker>>({});
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  const callbacksRef = useRef({
    onBuildingPinChange,
    onCustomPinMove,
    onAddCustomPin,
    onStatusChange,
    onMapReady,
  });

  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    callbacksRef.current = {
      onBuildingPinChange,
      onCustomPinMove,
      onAddCustomPin,
      onStatusChange,
      onMapReady,
    };
  }, [
    onBuildingPinChange,
    onCustomPinMove,
    onAddCustomPin,
    onStatusChange,
    onMapReady,
  ]);

  // Initialize Google Maps once.
  useEffect(() => {
    let cancelled = false;
    let mapClickListener: google.maps.MapsEventListener | undefined;

    async function initialize() {
      if (!containerRef.current) return;

      callbacksRef.current.onStatusChange("loading");

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
          zoom: INITIAL_ZOOM,
          mapTypeId: "hybrid",
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });

        mapRef.current = map;

        const buildingMarkers: Partial<Record<BuildingId, google.maps.Marker>> =
          {};

        buildings.forEach((building) => {
          if (!building.coordinate) return;

          const marker = new Marker({
            map,
            position: building.coordinate,
            title: building.name,
            clickable: false,
            draggable: false,
            label: {
              text: building.name,
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "12px",
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#171717",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 9,
            },
          });

          marker.addListener("dragend", () => {
            const position = marker.getPosition();

            if (position) {
              callbacksRef.current.onBuildingPinChange(building.id, {
                lat: position.lat(),
                lng: position.lng(),
              });
            }
          });

          buildingMarkers[building.id] = marker;
        });

        if (cancelled) {
          Object.values(buildingMarkers).forEach((marker) =>
            marker?.setMap(null),
          );
          return;
        }

        buildingMarkersRef.current = buildingMarkers;

        mapClickListener = map.addListener(
          "click",
          (event: google.maps.MapMouseEvent) => {
            if (!event.latLng) return;

            callbacksRef.current.onAddCustomPin({
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            });
          },
        );

        callbacksRef.current.onMapReady(map);
        setMapInitialized(true);
        callbacksRef.current.onStatusChange("ready");
      } catch (error) {
        console.error("[Campus Map] Initialization failed:", error);

        if (!cancelled) {
          callbacksRef.current.onStatusChange("error");
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      mapClickListener?.remove();

      Object.values(buildingMarkersRef.current).forEach((marker) =>
        marker?.setMap(null),
      );

      Object.values(customMarkersRef.current).forEach((marker) =>
        marker.setMap(null),
      );

      buildingMarkersRef.current = {};
      customMarkersRef.current = {};

      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  // Update building marker positions.
  useEffect(() => {
    Object.entries(pinOverrides).forEach(([id, coordinate]) => {
      const marker = buildingMarkersRef.current[id as BuildingId];

      if (marker && coordinate) {
        marker.setPosition(coordinate);
      }
    });
  }, [pinOverrides, mapInitialized]);

  // Enable building marker dragging.
  useEffect(() => {
    Object.values(buildingMarkersRef.current).forEach((marker) => {
      marker?.setDraggable(adjustPins);
      marker?.setClickable(false);
    });
  }, [adjustPins, mapInitialized]);

  // Create and update custom markers.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapInitialized) return;

    const activeIds = new Set(customPins.map((pin) => pin.id));

    Object.entries(customMarkersRef.current).forEach(([id, marker]) => {
      if (!activeIds.has(id)) {
        marker.setMap(null);
        delete customMarkersRef.current[id];
      }
    });

    void importLibrary("marker")
      .then((library) => {
        const { Marker } = library as google.maps.MarkerLibrary;

        customPins.forEach((pin) => {
          const existing = customMarkersRef.current[pin.id];

          if (existing) {
            existing.setPosition({ lat: pin.lat, lng: pin.lng });
            existing.setTitle(pin.name);
            existing.setLabel({
              text: pin.name,
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "11px",
            });
            existing.setDraggable(adjustPins);
            return;
          }

          const marker = new Marker({
            map,
            position: { lat: pin.lat, lng: pin.lng },
            title: pin.name,
            draggable: adjustPins,
            label: {
              text: pin.name,
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "11px",
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#2563eb",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 8,
            },
          });

          marker.addListener("dragend", () => {
            const position = marker.getPosition();

            if (position) {
              callbacksRef.current.onCustomPinMove(pin.id, {
                lat: position.lat(),
                lng: position.lng(),
              });
            }
          });

          customMarkersRef.current[pin.id] = marker;
        });
      })
      .catch((error) => {
        console.error("[Campus Map] Custom marker error:", error);
      });
  }, [customPins, adjustPins, mapInitialized]);

  // Update the user's location marker.
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (!userPosition) {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      return;
    }

    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        map,
        position: userPosition,
        title: "Your location",
        zIndex: 1000,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#16a34a",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
          scale: 8,
        },
      });
    } else {
      userMarkerRef.current.setPosition(userPosition);
    }
  }, [userPosition]);

  return (
    <div className="relative h-[520px] w-full bg-muted sm:h-[620px]">
      <div ref={containerRef} className="size-full" />

      {addPinMode && (
        <div className="absolute left-3 top-3 rounded-lg border border-blue-200 bg-white/95 px-3 py-2 text-xs font-medium text-blue-800 shadow-sm">
          Click anywhere on the map to place a pin
        </div>
      )}

      {adjustPins && (
        <div className="absolute left-3 top-3 rounded-lg border border-amber-300 bg-white/95 px-3 py-2 text-xs font-medium text-amber-800 shadow-sm">
          Drag building or custom pins to reposition
        </div>
      )}

      <div className="absolute bottom-3 left-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2 text-[10px] text-slate-700">
          <span className="size-2 rounded-full bg-slate-900" />
          Buildings
          <span className="ml-2 size-2 rounded-full bg-blue-600" />
          Custom pins
          <span className="ml-2 size-2 rounded-full bg-green-600" />
          You
        </div>
      </div>
    </div>
  );
}

export default function CampusMapPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingId | null>(
    null,
  );

  const [selectedFloor, setSelectedFloor] = useState<FloorId>("ground");

  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);

  const [locationMessage, setLocationMessage] = useState(
    "Location has not been requested.",
  );

  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");

  const [adjustPins, setAdjustPins] = useState(false);
  const [addPinMode, setAddPinMode] = useState(false);

  const [pinOverrides, setPinOverrides] = useState<PinOverrides>({});

  const [customPins, setCustomPins] = useState<CustomPin[]>([]);

  const [pinsHydrated, setPinsHydrated] = useState(false);

  const [fromId, setFromId] = useState("gps");
  const [toId, setToId] = useState("");

  const [routeStatus, setRouteStatus] = useState<RouteStatus>("idle");

  const [routeMessage, setRouteMessage] = useState("");
  const [routeSummary, setRouteSummary] = useState("");
  const [search, setSearch] = useState("");

  // In-app pin dialog state.
  const [pinDialog, setPinDialog] = useState<PinDialog>(null);
  const [pinNameInput, setPinNameInput] = useState("");

  const mapRef = useRef<google.maps.Map | null>(null);

  const routePolylinesRef = useRef<google.maps.Polyline[]>([]);

  // Restore saved pins from browser storage.
  useEffect(() => {
    try {
      const savedPins = localStorage.getItem(CUSTOM_PINS_KEY);

      if (savedPins) {
        setCustomPins(JSON.parse(savedPins) as CustomPin[]);
      }

      const savedOverrides = localStorage.getItem(BUILDING_OVERRIDES_KEY);

      if (savedOverrides) {
        setPinOverrides(JSON.parse(savedOverrides) as PinOverrides);
      }
    } catch (error) {
      console.error("Unable to restore saved campus pins:", error);
    } finally {
      setPinsHydrated(true);
    }
  }, []);

  // Persist custom pins.
  useEffect(() => {
    if (pinsHydrated) {
      localStorage.setItem(CUSTOM_PINS_KEY, JSON.stringify(customPins));
    }
  }, [customPins, pinsHydrated]);

  // Persist adjusted building coordinates.
  useEffect(() => {
    if (pinsHydrated) {
      localStorage.setItem(
        BUILDING_OVERRIDES_KEY,
        JSON.stringify(pinOverrides),
      );
    }
  }, [pinOverrides, pinsHydrated]);

  const selectedBuildingData = useMemo(
    () => buildings.find((item) => item.id === selectedBuilding) ?? null,
    [selectedBuilding],
  );

  const filteredBuildings = useMemo(
    () =>
      buildings.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  // Available route starting points and destinations.
  const places = useMemo<PlaceOption[]>(() => {
    const options: PlaceOption[] = [];

    if (userPosition) {
      options.push({
        id: "gps",
        name: "My current location (GPS)",
        coordinate: userPosition,
        kind: "gps",
      });
    }

    buildings.forEach((building) => {
      const coordinate = getBuildingCoordinate(building.id, pinOverrides);

      if (coordinate) {
        options.push({
          id: `building:${building.id}`,
          name: building.name,
          coordinate,
          kind: "building",
        });
      }
    });

    customPins.forEach((pin) => {
      options.push({
        id: `custom:${pin.id}`,
        name: pin.name,
        coordinate: { lat: pin.lat, lng: pin.lng },
        kind: "custom",
      });
    });

    return options;
  }, [userPosition, pinOverrides, customPins]);

  const clearRoute = useCallback(() => {
    routePolylinesRef.current.forEach((line) => line.setMap(null));
    routePolylinesRef.current = [];
    setRouteSummary("");
  }, []);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleBuildingPinChange = useCallback(
    (id: BuildingId, coordinate: Coordinate) => {
      setPinOverrides((current) => ({
        ...current,
        [id]: coordinate,
      }));
    },
    [],
  );

  const handleCustomPinMove = useCallback(
    (id: string, coordinate: Coordinate) => {
      setCustomPins((current) =>
        current.map((pin) => (pin.id === id ? { ...pin, ...coordinate } : pin)),
      );
    },
    [],
  );

  // Map click opens the in-app Add Pin dialog.
  const handleAddCustomPin = useCallback(
    (coordinate: Coordinate) => {
      if (!addPinMode) return;

      setPinNameInput(`Custom Pin ${customPins.length + 1}`);
      setPinDialog({ type: "add", coordinate });
      setAddPinMode(false);
    },
    [addPinMode, customPins.length],
  );

  const openRenameDialog = useCallback((pin: CustomPin) => {
    setPinNameInput(pin.name);
    setPinDialog({ type: "rename", pin });
  }, []);

  const openDeleteDialog = useCallback((pin: CustomPin) => {
    setPinDialog({ type: "delete", pin });
  }, []);

  // Save a new pin or rename an existing pin.
  const savePinDialog = useCallback(() => {
    const name = pinNameInput.trim();

    if (!name || !pinDialog) return;

    if (pinDialog.type === "add") {
      const pin: CustomPin = {
        id: crypto.randomUUID(),
        name,
        ...pinDialog.coordinate,
      };

      setCustomPins((current) => [...current, pin]);
      setLocationMessage(`Added pin: ${name}`);
      setPinDialog(null);
      return;
    }

    if (pinDialog.type === "rename") {
      const editingPinId = pinDialog.pin.id;

      setCustomPins((current) =>
        current.map((item) =>
          item.id === editingPinId ? { ...item, name } : item,
        ),
      );

      setLocationMessage(`Renamed pin to ${name}.`);
      setPinDialog(null);
    }
  }, [pinDialog, pinNameInput]);

  // Confirm delete or reset actions.
  const confirmPinDialog = useCallback(() => {
    if (!pinDialog) return;

    if (pinDialog.type === "delete") {
      const id = pinDialog.pin.id;
      const name = pinDialog.pin.name;

      setCustomPins((current) => current.filter((pin) => pin.id !== id));

      if (fromId === `custom:${id}`) setFromId("gps");
      if (toId === `custom:${id}`) setToId("");

      clearRoute();
      setLocationMessage(`Deleted pin: ${name}`);
      setPinDialog(null);
      return;
    }

    if (pinDialog.type === "reset") {
      setPinOverrides({});
      setAdjustPins(false);
      setLocationMessage("Building pins reset to configured coordinates.");
      setPinDialog(null);
    }
  }, [pinDialog, fromId, toId, clearRoute]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by this browser.");
      return;
    }

    setLocationMessage("Finding your location...");

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const position = {
          lat: result.coords.latitude,
          lng: result.coords.longitude,
          accuracy: result.coords.accuracy,
        };

        setUserPosition(position);
        setFromId("gps");

        setLocationMessage(
          `GPS available · Accuracy ±${Math.round(position.accuracy)} m`,
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

  // Calculate walking directions between selected points.
  const calculateRoute = useCallback(async () => {
    const origin = places.find((place) => place.id === fromId);
    const destination = places.find((place) => place.id === toId);

    if (!origin || !destination) {
      setRouteStatus("error");
      setRouteMessage(
        "Choose both a starting point and a destination. Use Locate me for GPS starting point.",
      );
      return;
    }

    if (origin.id === destination.id) {
      setRouteStatus("error");
      setRouteMessage("Choose two different locations.");
      return;
    }

    const map = mapRef.current;

    if (!map) {
      setRouteStatus("error");
      setRouteMessage("The map is not ready yet.");
      return;
    }

    clearRoute();
    setRouteStatus("calculating");
    setRouteMessage("Calculating outdoor walking route...");

    try {
      const { Route } = (await importLibrary(
        "routes",
      )) as google.maps.RoutesLibrary;

      const result = await Route.computeRoutes({
        origin: origin.coordinate,
        destination: destination.coordinate,
        travelMode: "WALKING",
        fields: ["path", "distanceMeters", "durationMillis"],
      });

      const route = result.routes?.[0];

      if (!route) {
        throw new Error("No walking route was returned for these locations.");
      }

      const polylines = route.createPolylines();

      if (!polylines.length) {
        throw new Error("The route has no drawable path.");
      }

      polylines.forEach((line) => line.setMap(map));
      routePolylinesRef.current = polylines;

      const path = route.path ?? [];

      if (path.length) {
        const bounds = new google.maps.LatLngBounds();

        path.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds, 70);
      }

      const distance = route.distanceMeters ?? 0;
      const duration = route.durationMillis ?? 0;

      const distanceLabel =
        distance >= 1000
          ? `${(distance / 1000).toFixed(2)} km`
          : `${Math.round(distance)} m`;

      setRouteSummary(
        `${distanceLabel} · Approximately ${Math.max(
          1,
          Math.round(duration / 60000),
        )} min`,
      );

      setRouteStatus("success");
      setRouteMessage(`Walking route: ${origin.name} → ${destination.name}`);
    } catch (error) {
      console.error("[Campus Map] Route error:", error);
      setRouteStatus("error");

      setRouteMessage(
        error instanceof Error
          ? error.message
          : "Unable to calculate the route. Check Routes API configuration.",
      );
    }
  }, [places, fromId, toId, clearRoute]);

  const copyPinCoordinates = useCallback(
    async (id: BuildingId) => {
      const coordinate = getBuildingCoordinate(id, pinOverrides);
      if (!coordinate) return;

      const value = `{ lat: ${coordinate.lat.toFixed(
        7,
      )}, lng: ${coordinate.lng.toFixed(7)} }`;

      try {
        await navigator.clipboard.writeText(value);
        setLocationMessage(`${id}: coordinates copied.`);
      } catch {
        setLocationMessage(`Copy failed. Coordinates: ${value}`);
      }
    },
    [pinOverrides],
  );

  const resetBuildingPins = useCallback(() => {
    setPinDialog({ type: "reset" });
  }, []);

  const mapReady = mapStatus === "ready";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <MapToolbar
          selectedBuilding={selectedBuilding}
          selectedFloor={selectedFloor}
          onBuildingChange={setSelectedBuilding}
          onFloorChange={setSelectedFloor}
        />

        {/* Location status */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Crosshair className="size-4 text-muted-foreground" />

            <div className="min-w-0">
              <p className="text-xs font-medium">{locationMessage}</p>

              {userPosition && (
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {userPosition.lat.toFixed(6)}, {userPosition.lng.toFixed(6)}
                  {" · "}±{Math.round(userPosition.accuracy)} m
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={locateUser}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium hover:bg-accent"
          >
            <LocateFixed className="size-3.5" />
            Locate me
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Map */}
          <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />

                <div>
                  <p className="text-xs font-semibold">University Campus Map</p>

                  <p className="text-[10px] text-muted-foreground">
                    Building and floor selection does not change the campus map
                    view.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!mapReady}
                  onClick={() => {
                    setAddPinMode((value) => !value);
                    setAdjustPins(false);
                  }}
                  className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium disabled:opacity-40 ${
                    addPinMode
                      ? "border-blue-400 bg-blue-50 text-blue-900"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <Plus className="size-3.5" />
                  {addPinMode ? "Cancel Add Pin" : "Add Pin"}
                </button>

                <button
                  type="button"
                  disabled={!mapReady}
                  onClick={() => {
                    setAdjustPins((value) => !value);
                    setAddPinMode(false);
                  }}
                  className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium disabled:opacity-40 ${
                    adjustPins
                      ? "border-amber-400 bg-amber-50 text-amber-900"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {adjustPins ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Pencil className="size-3.5" />
                  )}
                  {adjustPins ? "Finish Adjusting" : "Adjust Pins"}
                </button>

                <button
                  type="button"
                  onClick={resetBuildingPins}
                  disabled={Object.keys(pinOverrides).length === 0}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium hover:bg-accent disabled:opacity-40"
                >
                  <RotateCcw className="size-3.5" />
                  Reset Building Pins
                </button>
              </div>
            </div>

            {mapStatus === "error" ? (
              <div className="flex h-[520px] flex-col items-center justify-center gap-3 p-6 text-center">
                <MapPin className="size-7 text-muted-foreground" />
                <p className="text-sm font-semibold">
                  Google Maps could not be loaded
                </p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Check your API key, Maps JavaScript API and browser console
                  for the actual Google Maps error.
                </p>
              </div>
            ) : (
              <div className="relative">
                <GoogleCampusMap
                  userPosition={userPosition}
                  pinOverrides={pinOverrides}
                  customPins={customPins}
                  adjustPins={adjustPins}
                  addPinMode={addPinMode}
                  onBuildingPinChange={handleBuildingPinChange}
                  onCustomPinMove={handleCustomPinMove}
                  onAddCustomPin={handleAddCustomPin}
                  onStatusChange={setMapStatus}
                  onMapReady={handleMapReady}
                />

                {!mapReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/75">
                    <div className="text-center">
                      <div className="mx-auto size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                      <p className="mt-3 text-xs text-muted-foreground">
                        Loading campus map...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
              <p className="text-[10px] text-muted-foreground">
                {addPinMode
                  ? "Click the map to place a named custom pin."
                  : adjustPins
                    ? "Drag building or custom pins to reposition them."
                    : "Use Add Pin to create a location, or Adjust Pins to reposition."}
              </p>

              <p className="text-[10px] text-muted-foreground">
                {mapReady ? "Google Maps · Online" : "Map loading"}
              </p>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* From and To */}
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Walking directions</h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Choose a starting point and destination.
              </p>

              <label className="mt-3 block text-[11px] font-medium text-muted-foreground">
                From
              </label>

              <select
                value={fromId}
                onChange={(event) => {
                  setFromId(event.target.value);
                  clearRoute();
                  setRouteStatus("idle");
                  setRouteMessage("");
                }}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="gps" disabled={!userPosition}>
                  My current location (GPS)
                  {userPosition ? "" : " — use Locate me first"}
                </option>

                <optgroup label="Buildings">
                  {places
                    .filter((place) => place.kind === "building")
                    .map((place) => (
                      <option key={place.id} value={place.id}>
                        {place.name}
                      </option>
                    ))}
                </optgroup>

                {customPins.length > 0 && (
                  <optgroup label="Custom pins">
                    {places
                      .filter((place) => place.kind === "custom")
                      .map((place) => (
                        <option key={place.id} value={place.id}>
                          {place.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>

              <label className="mt-3 block text-[11px] font-medium text-muted-foreground">
                To
              </label>

              <select
                value={toId}
                onChange={(event) => {
                  setToId(event.target.value);
                  clearRoute();
                  setRouteStatus("idle");
                  setRouteMessage("");
                }}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Choose destination</option>

                <optgroup label="Buildings">
                  {places
                    .filter((place) => place.kind === "building")
                    .map((place) => (
                      <option key={place.id} value={place.id}>
                        {place.name}
                      </option>
                    ))}
                </optgroup>

                {customPins.length > 0 && (
                  <optgroup label="Custom pins">
                    {places
                      .filter((place) => place.kind === "custom")
                      .map((place) => (
                        <option key={place.id} value={place.id}>
                          {place.name}
                        </option>
                      ))}
                  </optgroup>
                )}

                {userPosition && (
                  <option value="gps">My current location (GPS)</option>
                )}
              </select>

              <button
                type="button"
                onClick={calculateRoute}
                disabled={
                  !fromId ||
                  !toId ||
                  !places.some((place) => place.id === fromId) ||
                  !places.some((place) => place.id === toId) ||
                  !mapReady ||
                  routeStatus === "calculating"
                }
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Navigation className="size-3.5" />
                {routeStatus === "calculating"
                  ? "Calculating route..."
                  : "Find Route"}
              </button>

              {routeMessage && (
                <div
                  className={`mt-3 rounded-lg p-3 text-xs leading-5 ${
                    routeStatus === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {routeMessage}
                  {routeSummary && (
                    <p className="mt-1 font-semibold text-foreground">
                      {routeSummary}
                    </p>
                  )}
                </div>
              )}

              <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                Outdoor walking directions use Google Routes. Indoor navigation
                requires verified indoor paths and QR starting points; this
                route does not provide indoor directions.
              </p>
            </section>

            {/* Custom pins */}
            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Custom pins</h2>
                <span className="text-[10px] text-muted-foreground">
                  {customPins.length} saved
                </span>
              </div>

              {customPins.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  No custom pins yet. Select Add Pin, then click a location on
                  the map.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {customPins.map((pin) => (
                    <div
                      key={pin.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 shrink-0 text-blue-600" />

                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                          {pin.name}
                        </span>

                        <button
                          type="button"
                          title="Rename pin"
                          onClick={() => openRenameDialog(pin)}
                          className="rounded p-1.5 hover:bg-accent"
                        >
                          <Pencil className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          title="Delete pin"
                          onClick={() => openDeleteDialog(pin)}
                          className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                        {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                Custom pin names and coordinates are saved in this browser using
                local storage.
              </p>
            </section>

            {/* Building pins */}
            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Building pins</h2>
                <span className="text-[10px] text-muted-foreground">
                  {buildings.length} locations
                </span>
              </div>

              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search buildings..."
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="mt-2 space-y-1">
                {filteredBuildings.map((building) => {
                  const coordinate = getBuildingCoordinate(
                    building.id,
                    pinOverrides,
                  );

                  const isSelected = selectedBuilding === building.id;

                  return (
                    <div
                      key={building.id}
                      className={`rounded-lg border p-3 ${
                        isSelected
                          ? "border-foreground/30 bg-accent/50"
                          : "border-transparent"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedBuilding(building.id)}
                        className="flex w-full items-center gap-2 text-left"
                      >
                        <Building2 className="size-4 shrink-0 text-muted-foreground" />

                        <span className="min-w-0 flex-1 text-xs font-medium">
                          {building.name}
                        </span>

                        {isSelected && <Check className="size-3.5" />}
                      </button>

                      {coordinate && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {coordinate.lat.toFixed(6)},{" "}
                            {coordinate.lng.toFixed(6)}
                          </span>

                          <button
                            type="button"
                            onClick={() => void copyPinCoordinates(building.id)}
                            className="shrink-0 text-[10px] font-medium underline underline-offset-2"
                          >
                            Copy pin
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {Object.keys(pinOverrides).length > 0 && (
                <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                  Adjusted building pin positions are saved in this browser. Use
                  Reset Building Pins to restore the configured coordinates.
                </p>
              )}
            </section>

            {/* Selected building */}
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Selected building</h2>

              <div className="mt-3 space-y-3 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Building</span>
                  <span className="font-medium">
                    {selectedBuildingData?.name ?? "Not selected"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Floor</span>
                  <span className="font-medium">
                    {selectedBuilding
                      ? floors.find((item) => item.id === selectedFloor)?.label
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">GPS accuracy</span>
                  <span className="font-medium">
                    {userPosition
                      ? `±${Math.round(userPosition.accuracy)} m`
                      : "Unavailable"}
                  </span>
                </div>
              </div>
            </section>

            <div className="flex gap-2 rounded-xl border border-border bg-muted/20 p-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-[10px] leading-5 text-muted-foreground">
                Selecting a building or floor only updates the selection panel.
                GPS does not identify indoor floors. Indoor routing will use QR
                anchors and verified floor-map data.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* In-app modal: Add, rename, delete and reset pins */}
      {pinDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPinDialog(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-dialog-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="pin-dialog-title" className="text-base font-semibold">
                  {pinDialog.type === "add"
                    ? "Add custom pin"
                    : pinDialog.type === "rename"
                      ? "Edit pin name"
                      : pinDialog.type === "delete"
                        ? "Delete custom pin"
                        : "Reset building pins"}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {pinDialog.type === "add"
                    ? "Give this map location a name."
                    : pinDialog.type === "rename"
                      ? "Update the name displayed on the map."
                      : pinDialog.type === "delete"
                        ? `Are you sure you want to delete "${pinDialog.pin.name}"?`
                        : "Restore all building markers to their original configured coordinates."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPinDialog(null)}
                aria-label="Close dialog"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {(pinDialog.type === "add" || pinDialog.type === "rename") && (
              <form
                className="mt-5 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  savePinDialog();
                }}
              >
                <label className="block text-xs font-medium">
                  Pin name
                  <input
                    autoFocus
                    value={pinNameInput}
                    onChange={(event) => setPinNameInput(event.target.value)}
                    maxLength={60}
                    placeholder="e.g. Main Entrance"
                    className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>

                {pinDialog.type === "add" && (
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Location: {pinDialog.coordinate.lat.toFixed(6)},{" "}
                    {pinDialog.coordinate.lng.toFixed(6)}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPinDialog(null)}
                    className="h-9 rounded-lg border border-border px-4 text-xs font-medium hover:bg-accent"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!pinNameInput.trim()}
                    className="h-9 rounded-lg bg-foreground px-4 text-xs font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Save pin
                  </button>
                </div>
              </form>
            )}

            {(pinDialog.type === "delete" || pinDialog.type === "reset") && (
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPinDialog(null)}
                  className="h-9 rounded-lg border border-border px-4 text-xs font-medium hover:bg-accent"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmPinDialog}
                  className="h-9 rounded-lg bg-destructive px-4 text-xs font-medium text-white hover:opacity-90"
                >
                  {pinDialog.type === "delete" ? "Delete pin" : "Reset pins"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
