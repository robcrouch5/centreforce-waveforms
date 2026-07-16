const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-gray-100 text-gray-700" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing", className: "bg-amber-100 text-amber-800" },
  ready: { label: "Ready to collect", className: "bg-green-100 text-green-700" },
  collected: { label: "Collected", className: "bg-gray-100 text-gray-500" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}
