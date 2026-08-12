// Great-circle (haversine) distance between two coordinates, in metres.
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

// Whether an attendee is inside the geofence. GPS is imprecise, especially
// indoors, so the reported accuracy is added to the radius as a tolerance,
// capped so a very poor fix cannot wave anyone through.
export function withinGeofence(
  distanceMeters: number,
  radiusMeters: number,
  accuracyMeters: number | undefined
): boolean {
  const tolerance = Math.min(Math.max(accuracyMeters ?? 0, 0), 100);
  return distanceMeters <= radiusMeters + tolerance;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
