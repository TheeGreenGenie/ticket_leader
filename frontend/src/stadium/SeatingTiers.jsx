import { useMemo, useEffect } from 'react';
import { TIER_CONFIGS, generateTierSeatPositions, buildSeatLookup } from './stadiumMath';
import { SeatInstances } from './SeatInstances';

// playerFloorY: current floor level of the walking ball (0, 18, 21, or 33)
// highlight: { tierId, section, row, seat, sectionOnly } | null
export function SeatingTiers({ onLookupReady, playerFloorY, highlight, onSectionClick }) {
  const tierData = useMemo(() => {
    return TIER_CONFIGS.map(cfg => {
      const { positions, meta } = generateTierSeatPositions(cfg);
      return { cfg, positions, meta };
    });
  }, []);

  const seatLookup = useMemo(() => {
    return buildSeatLookup(
      tierData.map(d => ({ tierId: d.cfg.id, positions: d.positions, meta: d.meta }))
    );
  }, [tierData]);

  useEffect(() => {
    onLookupReady?.(seatLookup);
  }, [seatLookup, onLookupReady]);

  return (
    <>
      {tierData.map(({ cfg, positions, meta }) => {
        const onThisLevel = playerFloorY != null &&
          Math.abs(playerFloorY - cfg.yBase) < 4;
        // Only pass highlight to the tier that owns the highlighted section
        const tierHighlight = highlight?.tierId === cfg.id ? highlight : null;
        return (
          <SeatInstances
            key={cfg.id}
            tierId={cfg.id}
            positions={positions}
            meta={meta}
            color={cfg.color}
            transparent={onThisLevel}
            highlight={tierHighlight}
            onSectionClick={onSectionClick}
          />
        );
      })}
    </>
  );
}
