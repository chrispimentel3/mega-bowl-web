/** Recharts tints legend labels with their series color, which leaves the purple and
 *  navy series unreadable in dark mode. Labels wear the text color; the colored marker
 *  beside each one carries identity. */
export const legendText = (value: unknown) => <span style={{ color: "var(--color-muted)" }}>{String(value)}</span>;
