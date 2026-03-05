import { useCallback, useEffect, useState } from "react"
import { ParkingSpot, type SpotStatus } from "@/components/parking/parking-spot"
import { parkingApi } from "@/lib/api"
import type { components } from "@/lib/api-types"

type ParkingSpace = components["schemas"]["ParkingSpace"]

// Parking spot dimensions
const SPOT_W = 90
const SPOT_H = 36
const SPOT_GAP = 4
const ANGLE = 25

// Road/lane dimensions
const LANE_W = 2 * 42 + SPOT_GAP
const PAD = 12
const LANE_GAP = 4
const VERT_X = PAD + SPOT_W + LANE_GAP

// Top row: spots above horizontal road
const TOP_SPOT_ALONG = 42
const TOP_SPOT_DEPTH = SPOT_W
const TOP_SPOT_COUNT = 14
const TOP_SPOTS_TOTAL_W = TOP_SPOT_COUNT * TOP_SPOT_ALONG + (TOP_SPOT_COUNT - 1) * SPOT_GAP

// Vertical layout: spots area, then road, then vertical bend
const TOP_SPOTS_Y = PAD
const HORIZ_Y = TOP_SPOTS_Y + TOP_SPOT_DEPTH + LANE_GAP

// Bottom row: spots below horizontal road (12 spots, right-aligned with top)
const BOTTOM_SPOT_COUNT = 12
const BOTTOM_SPOTS_Y = HORIZ_Y + LANE_W + LANE_GAP

// Vertical road spots: left side of vertical road (4 spots, top to bottom)
const VERT_SPOT_COUNT = 4
const VERT_SPOTS_X = VERT_X - LANE_GAP - TOP_SPOT_DEPTH
const VERT_SPOTS_START_Y = HORIZ_Y + LANE_W + LANE_GAP
const VERT_SPOTS_TOTAL_H = VERT_SPOT_COUNT * TOP_SPOT_ALONG + (VERT_SPOT_COUNT - 1) * SPOT_GAP

// Vertical bend (left side, going downward - sized to fit left spots)
const VERT_LENGTH = VERT_SPOTS_TOTAL_H + 2 * LANE_GAP
const VERT_Y_BOTTOM = HORIZ_Y + LANE_W + VERT_LENGTH

// Horizontal road (spots span full width including above vertical bend)
const HORIZ_X_LEFT = VERT_X + LANE_W
const HORIZ_X_RIGHT = VERT_X + LANE_GAP + TOP_SPOTS_TOTAL_W + LANE_GAP
const HORIZ_LENGTH = HORIZ_X_RIGHT - HORIZ_X_LEFT

// Barrier (Schranke)
const BARRIER_GAP = 6
const BARRIER_X = HORIZ_X_RIGHT + BARRIER_GAP
const BARRIER_W = 14
const BARRIER_H = LANE_W + 4

// SVG canvas
const SVG_W = BARRIER_X + BARRIER_W + PAD
const BOTTOM_SPOTS_END = BOTTOM_SPOTS_Y + TOP_SPOT_DEPTH
const SVG_H = Math.max(VERT_Y_BOTTOM, BOTTOM_SPOTS_END) + PAD

// Top spots positioned right to left (spot 1 = rightmost)
const topSpots = Array.from({ length: TOP_SPOT_COUNT }, (_, i) => ({
  number: i + 1,
  x: HORIZ_X_RIGHT - LANE_GAP - (i + 1) * TOP_SPOT_ALONG - i * SPOT_GAP,
  y: TOP_SPOTS_Y,
}))

// Bottom spots positioned right to left (spot 15 = rightmost, right-aligned with top)
const bottomSpots = Array.from({ length: BOTTOM_SPOT_COUNT }, (_, i) => ({
  number: TOP_SPOT_COUNT + i + 1,
  x: HORIZ_X_RIGHT - LANE_GAP - (i + 1) * TOP_SPOT_ALONG - i * SPOT_GAP,
  y: BOTTOM_SPOTS_Y,
}))

// Left spots positioned top to bottom (spot 27 = topmost, right of vertical road)
const vertSpots = Array.from({ length: VERT_SPOT_COUNT }, (_, i) => ({
  number: TOP_SPOT_COUNT + BOTTOM_SPOT_COUNT + i + 1,
  x: VERT_SPOTS_X,
  y: VERT_SPOTS_START_Y + i * (TOP_SPOT_ALONG + SPOT_GAP),
}))

interface LargeParkingLotProps {
  onSpotClick?: (spot: ParkingSpace) => void
  refreshKey?: number
  spaces?: ParkingSpace[]
}

export function LargeParkingLot({ onSpotClick, refreshKey, spaces: externalSpaces }: LargeParkingLotProps) {
  const [internalSpaces, setInternalSpaces] = useState<ParkingSpace[]>([])

  const fetchSpaces = useCallback(async () => {
    try {
      const response = await parkingApi.getParkingSpaces()
      if (response.ok) {
        setInternalSpaces(await response.json())
      }
    } catch {
      // silently ignore - spots will show as INACTIVE
    }
  }, [])

  useEffect(() => {
    if (!externalSpaces) {
      fetchSpaces()
    }
  }, [fetchSpaces, refreshKey, externalSpaces])

  const spaces = externalSpaces ?? internalSpaces

  const getStatus = (spotNumber: number): SpotStatus => {
    const space = spaces.find((s) => s.spotNumber === spotNumber)
    return (space?.status as SpotStatus) ?? "INACTIVE"
  }

  const getSpace = (spotNumber: number): ParkingSpace | undefined => {
    return spaces.find((s) => s.spotNumber === spotNumber)
  }

  const handleSpotClick = (spotNumber: number) => {
    if (!onSpotClick) return
    const space = getSpace(spotNumber)
    if (space) onSpotClick(space)
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="mx-auto h-full w-full max-w-2xl"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background */}
      <rect width={SVG_W} height={SVG_H} rx={10} fill="#e5e5e5" />

      {/* Horizontal road (extends from left edge of vertical segment to right) */}
      <rect
        x={VERT_X}
        y={HORIZ_Y}
        width={HORIZ_X_RIGHT - VERT_X}
        height={LANE_W}
        rx={2}
        fill="#d4d4d4"
      />

      {/* Vertical road (bend going down from left end) */}
      <rect
        x={VERT_X}
        y={HORIZ_Y}
        width={LANE_W}
        height={VERT_Y_BOTTOM - HORIZ_Y}
        rx={2}
        fill="#d4d4d4"
      />

      {/* Horizontal center dashes */}
      {Array.from({ length: 14 }, (_, i) => (
        <rect
          key={`h-${i}`}
          x={HORIZ_X_LEFT + 8 + i * (HORIZ_LENGTH / 14)}
          y={HORIZ_Y + LANE_W / 2 - 2}
          width={HORIZ_LENGTH / 30}
          height={4}
          rx={2}
          fill="#a3a3a3"
        />
      ))}

      {/* Vertical center dashes (below the corner) */}
      {Array.from({ length: 4 }, (_, i) => (
        <rect
          key={`v-${i}`}
          x={VERT_X + LANE_W / 2 - 2}
          y={HORIZ_Y + LANE_W + 8 + i * (VERT_LENGTH / 4)}
          width={4}
          height={VERT_LENGTH / 9}
          rx={2}
          fill="#a3a3a3"
        />
      ))}

      {/* Barrier (Schranke) marker - vertical */}
      <rect
        x={BARRIER_X}
        y={HORIZ_Y - 2}
        width={BARRIER_W}
        height={BARRIER_H}
        rx={3}
        fill="#a3a3a3"
      />
      <text
        x={BARRIER_X + BARRIER_W / 2}
        y={HORIZ_Y - 2 + BARRIER_H / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={8}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#525252"
        fontWeight={600}
        writingMode="vertical-rl"
      >
        Schranke
      </text>

      {/* Top parking spots (1-14, right to left, angled) */}
      {topSpots.map((spot, i) => (
        <ParkingSpot
          key={spot.number}
          number={spot.number}
          x={spot.x}
          y={spot.y}
          width={TOP_SPOT_ALONG}
          height={TOP_SPOT_DEPTH}
          rotation={ANGLE}
          delay={0.05 * i}
          status={getStatus(spot.number)}
          onClick={() => handleSpotClick(spot.number)}
        />
      ))}

      {/* Bottom parking spots (15-26, right to left, angled opposite) */}
      {bottomSpots.map((spot, i) => (
        <ParkingSpot
          key={spot.number}
          number={spot.number}
          x={spot.x}
          y={spot.y}
          width={TOP_SPOT_ALONG}
          height={TOP_SPOT_DEPTH}
          rotation={-ANGLE}
          delay={0.05 * (TOP_SPOT_COUNT + i)}
          status={getStatus(spot.number)}
          onClick={() => handleSpotClick(spot.number)}
        />
      ))}

      {/* Vertical road spots (27-30, top to bottom, left of vertical road) */}
      {vertSpots.map((spot, i) => (
        <ParkingSpot
          key={spot.number}
          number={spot.number}
          x={spot.x}
          y={spot.y}
          width={TOP_SPOT_DEPTH}
          height={TOP_SPOT_ALONG}
          rotation={ANGLE}
          delay={0.05 * (TOP_SPOT_COUNT + BOTTOM_SPOT_COUNT + i)}
          status={getStatus(spot.number)}
          onClick={() => handleSpotClick(spot.number)}
        />
      ))}
    </svg>
  )
}
