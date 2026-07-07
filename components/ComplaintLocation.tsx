import type { Complaint } from "@/lib/types";

export function ComplaintLocation({
  location,
}: {
  location: Complaint["location"];
}) {
  const hasCoords = location.lat !== 0 || location.lng !== 0;

  if (!location.address && !location.ward && !hasCoords) {
    return <p className="text-xs text-neutral-400">No location provided</p>;
  }

  const wardLine = [location.ward, location.district].filter(Boolean).join(", ");

  return (
    <p className="text-xs text-neutral-500">
      {location.address && <span>{location.address}</span>}
      {location.address && wardLine && " · "}
      {wardLine && <span>{wardLine}</span>}
      {(location.address || wardLine) && hasCoords && " · "}
      {hasCoords && (
        <a
          href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          View on map
        </a>
      )}
    </p>
  );
}
