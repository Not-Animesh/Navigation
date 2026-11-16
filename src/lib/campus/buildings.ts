export type FloorId =
  | "ground"
  | "first"
  | "second"
  | "third"
  | "fourth"
  | "fifth";

export type BuildingId = "a-block" | "b-block" | "c-block" | "ai-ml-block";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface CampusBuilding {
  id: BuildingId;
  name: string;
  description: string;
  coordinate: Coordinate | null;
  floors: FloorId[];
}

export const floors: {
  id: FloorId;
  label: string;
  shortLabel: string;
  level: number;
}[] = [
  { id: "ground", label: "Ground Floor", shortLabel: "G", level: 0 },
  { id: "first", label: "First Floor", shortLabel: "1", level: 1 },
  { id: "second", label: "Second Floor", shortLabel: "2", level: 2 },
  { id: "third", label: "Third Floor", shortLabel: "3", level: 3 },
  { id: "fourth", label: "Fourth Floor", shortLabel: "4", level: 4 },
  { id: "fifth", label: "Fifth Floor", shortLabel: "5", level: 5 },
];

export const campusCenter: Coordinate = {
  lat: 28.3661,
  lng: 77.540876,
};

export const buildings: CampusBuilding[] = [
  {
    id: "a-block",
    name: "A-Block",
    description: "Academic Building",
    coordinate: {
      lat: 28.3653869,
      lng: 77.5411177,
    },
    floors: floors.map((floor) => floor.id),
  },
  {
    id: "b-block",
    name: "B-Block",
    description: "Academic Building",
    coordinate: {
      lat: 28.365369,
      lng: 77.542091,
    },
    floors: floors.map((floor) => floor.id),
  },
  {
    id: "c-block",
    name: "C-Block",
    description: "Academic Building",
    coordinate: {
      lat: 28.3663849,
      lng: 77.5426852,
    },
    floors: floors.map((floor) => floor.id),
  },
  {
    id: "ai-ml-block",
    name: "AI-ML Block",
    description: "Academic Building",
    coordinate: {
      lat: 28.3655,
      lng: 77.5404,
    },
    floors: floors.map((floor) => floor.id),
  },
];
