import { createContext, useContext, useRef } from 'react';

const CollisionContext = createContext(null);

export function CollisionProvider({ children }) {
  const meshesRef    = useRef([]);  // THREE.Mesh[] — floor + wall colliders
  const stairZonesRef = useRef([]); // { box: THREE.Box3, fromY, toY }[]

  return (
    <CollisionContext.Provider value={{ meshesRef, stairZonesRef }}>
      {children}
    </CollisionContext.Provider>
  );
}

// Geometry components call this to register a mesh as a collider
export function useRegisterCollider() {
  const ctx = useContext(CollisionContext);
  return (mesh) => {
    if (mesh && ctx && !ctx.meshesRef.current.includes(mesh)) {
      ctx.meshesRef.current.push(mesh);
    }
  };
}

// Geometry components call this to register stair trigger zones
export function useRegisterStairZones() {
  const ctx = useContext(CollisionContext);
  return (zones) => {
    if (ctx) ctx.stairZonesRef.current.push(...zones);
  };
}

// WalkthroughControls calls this to read all colliders + stair zones
export function useCollisionContext() {
  return useContext(CollisionContext);
}
