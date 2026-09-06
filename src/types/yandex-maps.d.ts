export {};

declare global {
  interface YmapsPlacemark {
    events: { add: (event: string, handler: (e: unknown) => void) => void };
    geometry: {
      setCoordinates: (coords: [number, number]) => void;
      getCoordinates: () => [number, number];
    };
  }

  interface YmapsMapEvent {
    get: (key: "coords") => [number, number];
  }

  interface YmapsMap {
    geoObjects: {
      add: (obj: YmapsPlacemark) => void;
      removeAll: () => void;
    };
    events: { add: (event: string, handler: (e: YmapsMapEvent) => void) => void };
    setCenter: (coords: [number, number], zoom?: number) => void;
    destroy: () => void;
  }

  interface YmapsNamespace {
    ready: (cb: () => void) => void;
    Map: new (container: HTMLElement, state: Record<string, unknown>) => YmapsMap;
    Placemark: new (
      coordinates: [number, number],
      properties?: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => YmapsPlacemark;
  }

  interface Window {
    ymaps: YmapsNamespace;
  }
}
