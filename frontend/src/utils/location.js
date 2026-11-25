/**
 * Browser Geolocation and Client Context Utility for Askio
 */

let cachedCoordinates = null;
let cachedCity = null;

/**
 * Requests browser location permission and captures coordinates.
 * @returns {Promise<{ latitude: number, longitude: number, city?: string } | null>}
 */
export async function requestBrowserLocation() {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    console.warn('Geolocation is not supported by this browser.');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        cachedCoordinates = coords;

        // Attempt lightweight reverse geocoding to find city name
        try {
          const resp = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
          );
          if (resp.ok) {
            const data = await resp.json();
            const city = data.city || data.locality || data.principalSubdivision;
            if (city) {
              cachedCity = city;
              coords.city = city;
            }
          }
        } catch {
          // Non-critical, fallback to coordinates
        }

        try {
          localStorage.setItem('askio_location_granted', 'true');
        } catch {}

        resolve(coords);
      },
      (err) => {
        console.warn('Browser location access denied or unavailable:', err.message);
        try {
          localStorage.setItem('askio_location_granted', 'false');
        } catch {}
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 600000 // Cache for 10 minutes
      }
    );
  });
}

/**
 * Checks if location was previously granted and retrieves it silently if so.
 */
export function initLocationIfGranted() {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('askio_location_granted') === 'true') {
      requestBrowserLocation();
    }
  } catch {}
}

/**
 * Assembles real-time client metadata (location, timezone, formatted local date/time).
 * @returns {Object}
 */
export function getClientContext() {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const local_time = now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return {
    location: cachedCoordinates
      ? {
          latitude: cachedCoordinates.latitude,
          longitude: cachedCoordinates.longitude,
          city: cachedCity || cachedCoordinates.city
        }
      : null,
    timezone,
    local_time,
    language: typeof navigator !== 'undefined' ? navigator.language : 'en-US'
  };
}

/**
 * Check if location is currently enabled in memory or storage.
 */
export function isLocationEnabled() {
  return Boolean(cachedCoordinates);
}
