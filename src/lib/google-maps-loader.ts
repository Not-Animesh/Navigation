import {
  importLibrary as loadLibrary,
  setOptions,
} from "@googlemaps/js-api-loader";

let configured = false;

export async function importLibrary<
  T extends keyof google.maps.ImportLibraryMap,
>(libraryName: T): Promise<google.maps.ImportLibraryMap[T]> {
  // Google Maps can only run in the browser.
  if (typeof window === "undefined") {
    throw new Error("Google Maps can only be loaded in the browser.");
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key is missing.");
  }

  if (!configured) {
    setOptions({
      key: apiKey,
      v: "weekly",
    });

    configured = true;
  }

  return loadLibrary(libraryName) as Promise<google.maps.ImportLibraryMap[T]>;
}
