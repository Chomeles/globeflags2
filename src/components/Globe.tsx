import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
// @ts-ignore
import { OrbitControls, Sphere, Html, Text, Stars, useTexture, Environment, Cloud, Ring, Trail, Billboard, useGLTF } from '@react-three/drei';
// @ts-ignore
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette, GodRays } from '@react-three/postprocessing';
// @ts-ignore
import { BlendFunction, Resizer, KernelSize } from 'postprocessing';
import * as THREE from 'three';
import GeoJsonGeometry from 'three-geojson-geometry';
import countries from './countries-optimized.json';
import './Globe.css';

// Definiere genauere Typen für GeoJSON Features
interface Feature {
  type: string;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][];
  };
  properties: {
    NAME: string;
    ISO_A2: string;
    POPULATION: number;
    GDP: number;
  };
}

interface CountryData {
  name: string;
  capital: string;
  population: number;
  flag: string;
  gdp: number;
  area: number;
  languages: string;
  currencyName: string;
  currencySymbol: string;
}

interface CityMarkerProps {
  position: [number, number, number];
  name: string;
  population: number;
  scale?: number;
}

const CityMarker: React.FC<CityMarkerProps> = ({ position, name, population, scale = 1 }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.scale.setScalar(hovered ? scale * 1.4 : scale);
    }
  });
  
  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial 
          color={hovered ? "#ff5500" : "#ffaa00"}
          emissive={hovered ? "#ff5500" : "#ffaa00"}
          emissiveIntensity={hovered ? 2 : 1}
        />
        <Trail
          width={0.05}
          length={4}
          color={hovered ? "#ff5500" : "#ffaa00"}
          attenuation={(t) => t * t}
        />
      </mesh>
      {hovered && (
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Html position={[0, 0.05, 0]} distanceFactor={8} center>
            <div className="city-label">
              <h4>{name}</h4>
              <p>{population.toLocaleString()} Einwohner</p>
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
};

// Atmosphäre um den Globus
const Atmosphere = () => {
  return (
    <Sphere args={[1.01, 64, 64]} scale={[1.1, 1.1, 1.1]}>
      <meshStandardMaterial
        color="#4cc9ff"
        transparent
        opacity={0.1}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  );
};

// Lichtstrahlen am Nordpol
const NorthPoleLight = () => {
  const light = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (light.current) {
      light.current.rotation.z += delta * 0.2;
    }
  });
  
  return (
    <mesh ref={light} position={[0, 1.1, 0]} rotation={[0, 0, 0]}>
      <coneGeometry args={[0.4, 1, 6, 1, false, 0, Math.PI * 2]} />
      <meshBasicMaterial 
        color="#4cc9ff" 
        transparent 
        opacity={0.6} 
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

function GlobeInner() {
  const globeRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nightMode, setNightMode] = useState(false);
  const [showPopulation, setShowPopulation] = useState(false);
  const [showGDP, setShowGDP] = useState(false);
  const { camera } = useThree();
  const [initialAnimation, setInitialAnimation] = useState(true);
  const [initialZoom, setInitialZoom] = useState(5);

  // Optimierte Geometrie-Verarbeitung
  const typedFeatures = countries.features as unknown as Feature[];
  const countryGeometries = useMemo(() => 
    typedFeatures.map(feature => ({
      geometry: new GeoJsonGeometry(feature.geometry as any, 1),
      properties: feature.properties
    })), 
    []
  );

  // Initiale Animation beim Laden
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (initialAnimation) {
      timeout = setTimeout(() => {
        setInitialAnimation(false);
      }, 6000);
    }
    return () => clearTimeout(timeout);
  }, []);

  useFrame((state, delta) => {
    if (initialAnimation && initialZoom > 2.5) {
      setInitialZoom(prev => prev - delta * 0.8);
      camera.position.z = initialZoom;
    }
    
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * (initialAnimation ? 0.2 : 0.05);
    }
    
    if (groupRef.current) {
      // Leichte Schwankung des Globus
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case 'n': setNightMode(!nightMode); break;
        case 'p': setShowPopulation(!showPopulation); break;
        case 'g': setShowGDP(!showGDP); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nightMode, showPopulation, showGDP]);

  const handleCountryClick = async (isoCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`https://restcountries.com/v3.1/alpha/${isoCode}`);
      
      if (!response.ok) {
        throw new Error(`API Fehler: ${response.status}`);
      }
      
      const [data] = await response.json();
      
      // Ermittle die Sprachen
      const languages = data.languages ? Object.values(data.languages).join(', ') : 'N/A';
      
      // Ermittle die Währungsinformationen
      let currencyName = 'N/A';
      let currencySymbol = 'N/A';
      
      if (data.currencies) {
        const currencyCode = Object.keys(data.currencies)[0];
        if (currencyCode) {
          currencyName = data.currencies[currencyCode].name || 'N/A';
          currencySymbol = data.currencies[currencyCode].symbol || 'N/A';
        }
      }
      
      setSelectedCountry({
        name: data.name.common,
        capital: data.capital?.[0] || 'N/A',
        population: data.population,
        flag: data.flags.png,
        gdp: data.gdp || 0,
        area: data.area || 0,
        languages,
        currencyName,
        currencySymbol
      });

      // Smooth Camera Transition
      const country = typedFeatures.find(f => f.properties.ISO_A2 === isoCode);
      if (country) {
        const center = calculateCountryCenter(country);
        const targetPosition = new THREE.Vector3(center.x * 2, center.y * 2, center.z * 2);
        
        // Animiere die Kamera
        const startPosition = camera.position.clone();
        let t = 0;
        const animate = () => {
          t += 0.01;
          if (t > 1) return;
          
          camera.position.lerpVectors(startPosition, targetPosition, t);
          requestAnimationFrame(animate);
        };
        
        animate();
      }
    } catch (error) {
      console.error('Error fetching country data:', error);
      setError('Daten konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCountryCenter = (feature: Feature) => {
    const coordinates = feature.geometry.coordinates[0];
    const center = coordinates.reduce((acc: any, coord: any) => {
      acc[0] += coord[0];
      acc[1] += coord[1];
      return acc;
    }, [0, 0]);
    center[0] /= coordinates.length;
    center[1] /= coordinates.length;
    
    const phi = (90 - center[1]) * (Math.PI / 180);
    const theta = (center[0] + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    ).multiplyScalar(1.5);
  };

  const calculateColor = (properties: Feature['properties']) => {
    if (showPopulation) {
      const intensity = Math.min(properties.POPULATION / 100000000, 1);
      return new THREE.Color(1 - intensity, intensity, 0.2);
    }
    if (showGDP) {
      const intensity = Math.min(properties.GDP / 5000, 1);
      return new THREE.Color(0.1, intensity, 0.9 - intensity * 0.5);
    }
    return hoveredCountry === properties.NAME 
      ? new THREE.Color("#e74c3c")
      : new THREE.Color(0.2, 0.8, 0.5);
  };

  // Welthauptstädte für Marker
  const majorCities = [
    { name: "Berlin", position: latLongToVector3(52.5200, 13.4050), population: 3664088 },
    { name: "Paris", position: latLongToVector3(48.8566, 2.3522), population: 2161000 },
    { name: "London", position: latLongToVector3(51.5074, -0.1278), population: 8982000 },
    { name: "New York", position: latLongToVector3(40.7128, -74.0060), population: 8419000 },
    { name: "Tokyo", position: latLongToVector3(35.6762, 139.6503), population: 13960000 },
    { name: "Sydney", position: latLongToVector3(-33.8688, 151.2093), population: 5312000 },
    { name: "Rio de Janeiro", position: latLongToVector3(-22.9068, -43.1729), population: 6748000 },
    { name: "Kapstadt", position: latLongToVector3(-33.9249, 18.4241), population: 4618000 }
  ];

  function latLongToVector3(lat: number, lon: number, radius: number = 1.02): [number, number, number] {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return [x, y, z];
  }

  return (
    <>
      <Stars radius={300} depth={100} count={8000} factor={6} saturation={0.5} fade speed={2} />
      <Environment preset={nightMode ? "night" : "sunset"} />
      
      <group ref={groupRef}>
        {/* Hauptglobus */}
        <Sphere ref={globeRef} args={[1, 64, 64]}>
          <meshPhongMaterial
            color={nightMode ? "#16213e" : "#2c3e50"}
            transparent
            opacity={0.95}
            specular="#ffffff"
            shininess={150}
          />
        </Sphere>

        {/* Atmosphäre */}
        <Atmosphere />
        
        {/* Nordlicht-Effekt */}
        <NorthPoleLight />
        
        {/* Orbit-Ring */}
        <Ring 
          args={[1.2, 1.22, 120]} 
          position={[0, 0, 0]} 
          rotation={[Math.PI/2, 0, 0]}
        >
          <meshBasicMaterial 
            color="#4cc9ff" 
            transparent
            opacity={0.3} 
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending} 
          />
        </Ring>

        {/* Länder */}
        {countryGeometries.map(({ geometry, properties }, i) => (
          <mesh
            key={`${properties.ISO_A2}-${i}`}
            onClick={() => handleCountryClick(properties.ISO_A2)}
            onPointerOver={() => setHoveredCountry(properties.NAME)}
            onPointerOut={() => setHoveredCountry(null)}
            geometry={geometry}
          >
            <meshStandardMaterial
              color={calculateColor(properties)}
              transparent
              opacity={hoveredCountry === properties.NAME ? 0.8 : 0.6}
              roughness={0.5}
              metalness={0.6}
              envMapIntensity={2}
              emissive={hoveredCountry === properties.NAME ? "#ff9000" : "#000000"}
              emissiveIntensity={hoveredCountry === properties.NAME ? 0.5 : 0}
            />
            {hoveredCountry === properties.NAME && (
              <Text
                position={[0, 0, 1.1]}
                fontSize={0.06}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.005}
                outlineColor="#000000"
              >
                {properties.NAME}
              </Text>
            )}
          </mesh>
        ))}

        {/* Städte-Marker */}
        {majorCities.map((city, index) => (
          <CityMarker 
            key={index} 
            position={city.position} 
            name={city.name} 
            population={city.population} 
            scale={Math.log10(city.population) / 20}
          />
        ))}
        
        {/* Wolken */}
        {/* @ts-ignore */}
        <Cloud opacity={0.3} speed={0.3} width={10} depth={1.5} segments={20} position={[0, 0, 0]} scale={1.5}/>
        {/* @ts-ignore */}
        <Cloud opacity={0.2} speed={0.2} width={15} depth={0.5} segments={15} position={[0, 0, 0]} scale={1.6}/>
      </group>

      {/* Länderinfo-Karte */}
      {selectedCountry && (
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Html center position={[1.5, 0, 0]} distanceFactor={5}>
            <div className="country-card">
              <div className="card-header">
                <img src={selectedCountry.flag} alt={`Flagge von ${selectedCountry.name}`} />
                <div className="country-title">
                  <h2>{selectedCountry.name}</h2>
                  <p className="capital">{selectedCountry.capital}</p>
                </div>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <span>👥 Bevölkerung</span>
                  <p>{selectedCountry.population.toLocaleString()}</p>
                </div>
                <div className="stat-item">
                  <span>🌍 Fläche</span>
                  <p>{selectedCountry.area.toLocaleString()} km²</p>
                </div>
                <div className="stat-item">
                  <span>💰 Währung</span>
                  <p>{selectedCountry.currencyName} ({selectedCountry.currencySymbol})</p>
                </div>
                <div className="stat-item">
                  <span>🗣️ Sprachen</span>
                  <p>{selectedCountry.languages}</p>
                </div>
              </div>
              {isLoading && <div className="loading">Laden...</div>}
              {error && <div className="error">{error}</div>}
            </div>
          </Html>
        </Billboard>
      )}

      {/* Postprocessing Effekte für WOW-Faktor */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9}
          intensity={1.5}
          kernelSize={KernelSize.LARGE}
        />
        <ChromaticAberration 
          offset={[0.0005, 0.0005]} 
          radialModulation={true} 
          modulationOffset={0.5}
        />
        <Noise opacity={0.02} blendFunction={BlendFunction.ADD} />
        <Vignette darkness={0.4} offset={0.5} />
      </EffectComposer>
    </>
  );
}

export default function Globe() {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="globe-container">
      <div className="intro-overlay">
        <h1>Interaktiver 3D Weltatlas</h1>
        <p>Klicke auf ein Land, um mehr zu erfahren</p>
      </div>
      <div className="controls">
        <input
          type="text"
          placeholder="Land suchen..."
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <div className="keyboard-shortcuts">
          <span>N: Nachtmodus</span>
          <span>P: Bevölkerungsdichte</span>
          <span>G: BIP</span>
        </div>
      </div>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <fog attach="fog" args={['#000000', 2.5, 20]} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-5, -5, -5]} intensity={0.2} />
          <GlobeInner />
          <OrbitControls
            enableZoom={true}
            zoomSpeed={0.6}
            minDistance={1.5}
            maxDistance={10}
            enablePan={false}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
} 