import { useEffect, useRef, useState } from 'react';
import { MapPin, ExternalLink, AlertCircle } from 'lucide-react';

export default function MapView({ address, propertyName, className = '' }) {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const query = encodeURIComponent(address || propertyName || 'India');
  const embedUrl = `https://maps.google.com/maps?q=${query}&output=embed`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className={`rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-sm text-gray-900 dark:text-white">Location</span>
          {address && <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">— {address}</span>}
        </div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
          Open in Maps <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="relative h-64 bg-gray-100 dark:bg-gray-700">
        {!mapLoaded && !mapError && (
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
        ) : (
          <iframe
            ref={mapRef}
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setMapLoaded(true)}
            onError={() => setMapError(true)}
            title={`Map for ${propertyName}`}
            className={`transition-opacity duration-300 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>
    </div>
  );
}
