export function StadiumLighting() {
  return (
    <>
      {/* Strong ambient — nothing goes fully dark */}
      <ambientLight intensity={1.6} color="#ffffff" />

      {/* Hemisphere — crisp white sky, vivid green ground bounce */}
      <hemisphereLight skyColor="#e8f4ff" groundColor="#44aa22" intensity={1.2} />

      {/* Eight roof-mounted stadium floods — bright warm white, wide coverage */}
      <spotLight position={[ 90, 88,  50]} intensity={18} angle={0.65} penumbra={0.25} color="#fff6e0" castShadow={false} />
      <spotLight position={[-90, 88,  50]} intensity={18} angle={0.65} penumbra={0.25} color="#fff6e0" castShadow={false} />
      <spotLight position={[ 90, 88, -50]} intensity={18} angle={0.65} penumbra={0.25} color="#fff6e0" castShadow={false} />
      <spotLight position={[-90, 88, -50]} intensity={18} angle={0.65} penumbra={0.25} color="#fff6e0" castShadow={false} />

      {/* Four inner fill lights — directly above field for vivid grass green */}
      <spotLight position={[ 35, 52,  18]} intensity={12} angle={0.75} penumbra={0.5} color="#ffffff" castShadow={false} />
      <spotLight position={[-35, 52,  18]} intensity={12} angle={0.75} penumbra={0.5} color="#ffffff" castShadow={false} />
      <spotLight position={[ 35, 52, -18]} intensity={12} angle={0.75} penumbra={0.5} color="#ffffff" castShadow={false} />
      <spotLight position={[-35, 52, -18]} intensity={12} angle={0.75} penumbra={0.5} color="#ffffff" castShadow={false} />

      {/* Warm amber concourse fills — gives the seats and bowl a game-night glow */}
      <pointLight position={[  0, 22,   0]} intensity={6}   distance={180} color="#ffbb33" />
      <pointLight position={[ 60, 20,  60]} intensity={3.5} distance={120} color="#ffcc55" />
      <pointLight position={[-60, 20,  60]} intensity={3.5} distance={120} color="#ffcc55" />
      <pointLight position={[ 60, 20, -60]} intensity={3.5} distance={120} color="#ffcc55" />
      <pointLight position={[-60, 20, -60]} intensity={3.5} distance={120} color="#ffcc55" />

      {/* Upper concourse rim light */}
      <pointLight position={[  0, 38,   0]} intensity={4}   distance={200} color="#ffd488" />

      {/* Jumbotron blue-white glow downward onto field */}
      <pointLight position={[0, 34, -14]}   intensity={5}   distance={100} color="#88aaff" />
      <pointLight position={[0, 34,  14]}   intensity={5}   distance={100} color="#88aaff" />

      {/* Strong directional key — defines shape and depth */}
      <directionalLight position={[100, 160, 80]} intensity={3.5} color="#ffffff" castShadow={false} />
    </>
  );
}
