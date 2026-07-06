import type { Complaint } from "@/lib/types";

export function ComplaintLocation({
  location,
}: {
  location: Complaint["location"];
}) {
  const hasCoords = location.lat !== 0 || location.lng !== 0;

  if (!location.address && !hasCoords) {
    return <p className="text-xs text-neutral-400">No location provided</p>;
  }

  return (
    <p className="text-xs text-neutral-500">
      {location.address && <span>{location.address}</span>}
      {location.address && hasCoords && " · "}
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
