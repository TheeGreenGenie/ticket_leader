/**
 * Location Service for Venue Proximity Features
 * Handles geolocation, distance calculation, and reverse geocoding
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in miles
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if geolocation is supported by the browser
 * @returns {boolean}
 */
export function isGeolocationSupported() {
  return 'geolocation' in navigator;
}

/**
 * Check proximity to a venue
 * @param {Object} venueCoords - { lat: number, lng: number }
 * @returns {Promise<ProximityResult>}
 */
export async function checkProximity(venueCoords) {
  return new Promise((resolve) => {
    if (!isGeolocationSupported()) {
      resolve({ granted: false, reason: 'Geolocation not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const distance = haversineDistance(
          userLat,
          userLng,
          venueCoords.lat,
          venueCoords.lng
        );

        // Try to get city name
        let city = null;
        try {
          city = await reverseGeocode(userLat, userLng);
        } catch (e) {
          console.warn('Could not get city name:', e);
        }

        resolve({
          granted: true,
          userCoords: { lat: userLat, lng: userLng },
          distanceMiles: Math.round(distance * 10) / 10, // Round to 1 decimal
          isLocal: distance < 50,       // within 50 miles
          isRegional: distance < 200,   // within 200 miles
          nearVenue: distance < 5,      // basically at the venue
          city
        });
      },
      (error) => {
        // User denied or error occurred - no penalty
        resolve({
          granted: false,
          reason: error.code === 1 ? 'Permission denied' : 'Location unavailable'
        });
      },
      {
        enableHighAccuracy: false, // Don't need precise location
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
}

/**
 * Reverse geocode coordinates to get city name
 * Uses free Nominatim API (OpenStreetMap)
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string|null>}
 */
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'TicketLeader/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    // Extract city name (Nominatim returns various levels)
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      data.address?.county ||
      null
    );
  } catch (error) {
    console.warn('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Get proximity badge info based on distance
 * @param {Object} locationData
 * @returns {Object|null}
 */
export function getProximityBadge(locationData) {
  if (!locationData?.granted) {
    return null;
  }

  if (locationData.nearVenue) {
    return {
      type: 'near-venue',
      icon: '📍',
      label: "You're Here!",
      description: "You're at the venue!",
      color: '#10B981' // green
    };
  }

  if (locationData.isLocal) {
    return {
      type: 'local',
      icon: '🏠',
      label: 'Local Fan',
      description: `Rep your city! (${Math.round(locationData.distanceMiles)} mi away)`,
      color: '#667eea' // primary
    };
  }

  if (locationData.isRegional) {
    return {
      type: 'regional',
      icon: '🌎',
      label: 'Regional Fan',
      description: `${Math.round(locationData.distanceMiles)} miles from venue`,
      color: '#8B5CF6' // purple
    };
  }

  return {
    type: 'traveling',
    icon: '✈️',
    label: 'Traveling Fan',
    description: `Coming from ${Math.round(locationData.distanceMiles)} miles away!`,
    color: '#F59E0B' // amber
  };
}

export default {
  isGeolocationSupported,
  checkProximity,
  getProximityBadge
};
