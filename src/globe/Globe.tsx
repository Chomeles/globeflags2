import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
// @ts-ignore
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { GeoJSON, Polygon } from 'geojson';
import countries from './countries.json';

interface Country {
  name: string;
  capital: string;
  flag: string;
  // ... weitere Eigenschaften
}

function GlobeInner() {
  const globeRef = useRef<THREE.Mesh>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useFrame((state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.1;
    }
  });

  const handleCountryClick = async (countryCode: string) => {
    const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    const data: Country[] = await response.json();
    setSelectedCountry(data[0]);
  };

  const features = countries.features as GeoJSON.Feature[];

  return (
    <>
      <Sphere ref={globeRef} args={[1, 32, 32]}>
        <meshStandardMaterial color="blue" />
        {features.map((feature: GeoJSON.Feature) => {
          if (feature.geometry.type === 'Polygon') {
            const polygon = feature.geometry as Polygon;
            return (
              <mesh
                key={feature.properties?.iso_a3}
                geometry={new THREE.ShapeGeometry(
                  new THREE.Shape(
                    polygon.coordinates[0].map(
                      (coord) => new THREE.Vector2(coord[0], coord[1])
                    )
                  )
                )}
                onClick={() => handleCountryClick(feature.properties?.iso_a3 as string)}
              >
                <meshStandardMaterial color="green" />
              </mesh>
            );
          }
          return null;
        })}
      </Sphere>
      {selectedCountry && (
        <div className="country-info">
          <h2>{selectedCountry.name}</h2>
          <img src={selectedCountry.flag} alt={`Flag of ${selectedCountry.name}`} />
          <p>Capital: {selectedCountry.capital}</p>
          {/* Weitere Informationen */}
        </div>
      )}
    </>
  );
}

export default function Globe() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[1, 1, 1]} intensity={1} />
      <GlobeInner />
      <OrbitControls />
    </Canvas>
  );
} 