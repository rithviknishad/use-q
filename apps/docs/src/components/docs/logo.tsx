import * as React from "react";

/**
 * The use-q mark: a clockwise refetch arc orbiting a solid centre node — the
 * schema as the single source of truth, with caches cycling around it.
 *
 * Every rendering is derived from these numbers, so the header component, the
 * favicon, and the raster icons cannot drift apart. Run `pnpm gen:icons` after
 * changing anything here to rebuild the files in `public/`.
 */
export const LOGO_GEOMETRY = {
  viewBox: 64,
  tileRadius: 14,
  centre: 32,
  arcRadius: 17,
  strokeWidth: 7.5,
  nodeRadius: 7,
  arrowLength: 8.75,
  arrowHalfWidth: 6.75,
  /** The arc travels clockwise on screen from `tailAngle` to `headAngle`. */
  tailAngle: 15,
  headAngle: 95,
  tileFrom: "#10b981",
  tileTo: "#047857",
  glyph: "#ecfdf5",
} as const;

/** Position at maths angle `deg`, flipped for SVG's downward y-axis. */
function pointAt(deg: number, radius: number) {
  const t = (deg * Math.PI) / 180;
  const { centre } = LOGO_GEOMETRY;
  return [centre + radius * Math.cos(t), centre - radius * Math.sin(t)] as const;
}

/** The arc path and arrowhead polygon, shared by every rendering of the mark. */
export function logoPaths() {
  const { arcRadius, arrowLength, arrowHalfWidth, tailAngle, headAngle } =
    LOGO_GEOMETRY;

  const [tailX, tailY] = pointAt(tailAngle, arcRadius);
  const [headX, headY] = pointAt(headAngle, arcRadius);

  // Travelling clockwise means the angle decreases, so the tangent is (sin, cos)
  // and the arrowhead base runs along its perpendicular.
  const t = (headAngle * Math.PI) / 180;
  const dirX = Math.sin(t);
  const dirY = Math.cos(t);

  const largeArc = (tailAngle - headAngle + 360) % 360 > 180 ? 1 : 0;
  const n = (value: number) => Number(value.toFixed(3));

  return {
    arc: `M${n(tailX)} ${n(tailY)}A${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${n(headX)} ${n(headY)}`,
    arrowHead: (
      [
        [headX + arrowLength * dirX, headY + arrowLength * dirY],
        [headX - arrowHalfWidth * dirY, headY + arrowHalfWidth * dirX],
        [headX + arrowHalfWidth * dirY, headY - arrowHalfWidth * dirX],
      ] as const
    )
      .map(([x, y]) => `${n(x)},${n(y)}`)
      .join(" "),
  };
}

export function LogoMark({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  const {
    viewBox,
    tileRadius,
    centre,
    strokeWidth,
    nodeRadius,
    tileFrom,
    tileTo,
    glyph,
  } = LOGO_GEOMETRY;
  const { arc, arrowHead } = logoPaths();
  const gradientId = React.useId();

  return (
    <svg
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      className={className}
      aria-hidden
      {...props}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2={viewBox}
          y2={viewBox}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={tileFrom} />
          <stop offset="1" stopColor={tileTo} />
        </linearGradient>
      </defs>
      <rect
        width={viewBox}
        height={viewBox}
        rx={tileRadius}
        fill={`url(#${gradientId})`}
      />
      <circle cx={centre} cy={centre} r={nodeRadius} fill={glyph} />
      <path
        d={arc}
        fill="none"
        stroke={glyph}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <polygon points={arrowHead} fill={glyph} />
    </svg>
  );
}
