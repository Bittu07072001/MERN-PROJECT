import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, LocateFixed, MapPin } from 'lucide-react';

let googleMapsPromise;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps-api]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      previousAuthFailure?.();
      googleMapsPromise = null;
      reject(new Error('Google Maps authentication failed'));
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsApi = 'true';
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function hasValidApiKey(key) {
  return key && key !== 'your_google_maps_api_key_here';
}

function toCoordinatePair(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function getOsmEmbedUrl({ lat, lng }) {
  const delta = 0.01;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export default function MapView({ address, propertyName, location, className = '' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const propertyMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [locating, setLocating] = useState(false);
  const [fallbackCoordinates, setFallbackCoordinates] = useState(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [forceFallbackMap, setForceFallbackMap] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const canUseGoogleMapsApi = hasValidApiKey(apiKey);
  const useGoogleMap = canUseGoogleMapsApi && !forceFallbackMap;
  const coordinates = useMemo(() => toCoordinatePair(location), [location?.lat, location?.lng]);
  const displayAddress = address || [location?.address, location?.city, location?.state, location?.pincode].filter(Boolean).join(', ');
  const query = encodeURIComponent(displayAddress || propertyName || 'India');
  const fallbackMapUrl = fallbackCoordinates ? getOsmEmbedUrl(fallbackCoordinates) : '';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  const mapOptions = useMemo(() => ({
    zoom: coordinates ? 15 : 12,
    center: coordinates || { lat: 20.5937, lng: 78.9629 },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  }), [coordinates]);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!useGoogleMap || !mapRef.current) return;

      setMapLoaded(false);
      setMapError(false);

      try {
        const maps = await loadGoogleMaps(apiKey);
        if (cancelled || !mapRef.current) return;

        const map = new maps.Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;

        const placeMarker = (position, title = propertyName || 'Property location') => {
          map.setCenter(position);
          map.setZoom(15);
          propertyMarkerRef.current = new maps.Marker({
            map,
            position,
            title,
            animation: maps.Animation.DROP,
          });
          setMapLoaded(true);
        };

        if (coordinates) {
          placeMarker(coordinates);
          return;
        }

        const geocoder = new maps.Geocoder();
        geocoder.geocode({ address: displayAddress || propertyName || 'India' }, (results, status) => {
          if (cancelled) return;
          if (status !== 'OK' || !results?.[0]) {
            setForceFallbackMap(true);
            return;
          }

          placeMarker(results[0].geometry.location, results[0].formatted_address);
        });
      } catch {
        if (!cancelled) setForceFallbackMap(true);
      }
    }

    renderMap();

    return () => {
      cancelled = true;
      propertyMarkerRef.current?.setMap?.(null);
      userMarkerRef.current?.setMap?.(null);
    };
  }, [apiKey, useGoogleMap, coordinates, displayAddress, mapOptions, propertyName]);

  useEffect(() => {
    if (!useGoogleMap) return undefined;

    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      previousAuthFailure?.();
      setForceFallbackMap(true);
    };

    return () => {
      window.gm_authFailure = previousAuthFailure;
    };
  }, [useGoogleMap]);

  useEffect(() => {
    let cancelled = false;

    async function resolveFallbackMap() {
      if (useGoogleMap) return;

      setMapLoaded(false);
      setMapError(false);
      setFallbackCoordinates(null);

      if (coordinates) {
        setFallbackCoordinates(coordinates);
        return;
      }

      const searchText = displayAddress || propertyName;
      if (!searchText) {
        setMapError(true);
        return;
      }

      setFallbackLoading(true);

      try {
        const params = new URLSearchParams({
          q: searchText,
          format: 'json',
          limit: '1',
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) throw new Error('Geocoding failed');

        const results = await response.json();
        const first = results?.[0];
        const position = first ? { lat: Number(first.lat), lng: Number(first.lon) } : null;

        if (!cancelled && position && Number.isFinite(position.lat) && Number.isFinite(position.lng)) {
          setFallbackCoordinates(position);
        } else if (!cancelled) {
          setMapError(true);
        }
      } catch {
        if (!cancelled) setMapError(true);
      } finally {
        if (!cancelled) setFallbackLoading(false);
      }
    }

    resolveFallbackMap();

    return () => {
      cancelled = true;
    };
  }, [useGoogleMap, coordinates, displayAddress, propertyName]);

  const showMyLocation = () => {
    if (!navigator.geolocation || !window.google?.maps || !mapInstanceRef.current) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        userMarkerRef.current?.setMap?.(null);
        userMarkerRef.current = new window.google.maps.Marker({
          map: mapInstanceRef.current,
          position,
          title: 'Your location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
        mapInstanceRef.current.panTo(position);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={`rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="font-semibold text-sm text-gray-900 dark:text-white flex-shrink-0">Location</span>
          {displayAddress && <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">- {displayAddress}</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {useGoogleMap && mapLoaded && !mapError && (
            <button
              type="button"
              onClick={showMyLocation}
              disabled={locating}
              title="Show my location"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-60 transition-colors"
            >
              <LocateFixed className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
            </button>
          )}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Open in Maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="relative h-64 bg-gray-100 dark:bg-gray-700">
        {(!mapLoaded || fallbackLoading) && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {mapError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">Could not load map</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Open in Google Maps
            </a>
          </div>
        ) : useGoogleMap ? (
          <div
            ref={mapRef}
            title={`Map for ${propertyName}`}
            className={`w-full h-full transition-opacity duration-300 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : fallbackMapUrl ? (
          <iframe
            src={fallbackMapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            onLoad={() => setMapLoaded(true)}
            onError={() => setMapError(true)}
            title={`Map for ${propertyName}`}
            className={`transition-opacity duration-300 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}
      </div>
    </div>
  );
}
