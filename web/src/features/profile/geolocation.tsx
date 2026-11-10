import { createContext, useContext } from 'react';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Device location. Never throws: null means denied, unavailable or too slow. */
export interface Geolocator {
  current(): Promise<Coordinates | null>;
}

const TIMEOUT_MS = 10_000;

export const browserGeolocator: Geolocator = {
  current() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { timeout: TIMEOUT_MS, maximumAge: 60_000 },
      );
    });
  },
};

const GeolocatorContext = createContext<Geolocator>(browserGeolocator);
export const GeolocatorProvider = GeolocatorContext.Provider;
export const useGeolocator = () => useContext(GeolocatorContext);
