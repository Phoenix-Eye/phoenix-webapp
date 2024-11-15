import Head from "next/head";
import { useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import addCustomLayers, {
  addHotspotHeatmapLayer,
} from "~/utils/mapUtils/addCustomLayers";
import addCustomSources from "~/utils/mapUtils/addCustomSources";
import Timeslider from "~/Components/TimeSlider";
import NavBar from "~/Components/NavBar";
import ServicesLayer from "~/Components/Layers/ServicesLayer";
import EmergencyAlerts from "~/Components/Alerts/EmergencyAlerts";
import Image from "next/image";
import PhoenixEyeLogo from "~/assets/phoenixeyelogo.png";
import StartPage from "./StartPage";
import { wildfiresStore } from "~/store/wildfiresStore";
import useLayersStore from "~/store/layersStore";
import type { Alert } from "~/Components/Alerts/EmergencyAlerts";
import PopUp from "~/pages/MenuPages/PopUp";

const CENTER_COORDS: [number, number] = [-110.8968082457804, 31.25933620026809];
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
const INITIAL_ZOOM = 15;
const INITIAL_PITCH = 60;

export default function Home() {
  const [kilometersPerPixel, setKilometersPerPixel] = useState(0);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [userLogin, setIsUserLogin] = useState(false);
  const [showPopUp, setShowPopUp] = useState(true);
  const selectedCoordinates = wildfiresStore(
    (state) => state.selectedCoordinates,
  );
  const { selectedLayers } = useLayersStore();

  // Define the onAlertClick handler
  const onAlertClick = (alert: Alert) => {
    console.log("Alert clicked:", alert);
  };

  const flyToLocation = useCallback(
    (coords: [number, number], zoom = 15) => {
      if (map) {
        map.flyTo({
          center: coords,
          zoom: zoom,
          speed: 0.8,
          curve: 1,
          easing(t) {
            return t;
          },
        });
      }
    },
    [map],
  );

  useEffect(() => {
    if (userLogin) {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

      const mapInstance = new mapboxgl.Map({
        container: "map",
        projection: { name: "globe" },
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: CENTER_COORDS,
        zoom: INITIAL_ZOOM,
      });

      setMap(mapInstance);

      mapInstance.addControl(new mapboxgl.NavigationControl());
      mapInstance.addControl(new mapboxgl.FullscreenControl());

      mapInstance.on("style.load", () => {
        addCustomSources(mapInstance);
        addCustomLayers(mapInstance);

        mapInstance.setFog({
          color: "rgb(186, 210, 235)",
          "high-color": "rgb(36, 92, 223)",
          "horizon-blend": 0.02,
          "space-color": "rgb(11, 11, 25)",
          "star-intensity": 0.6,
        });

        mapInstance.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 });
        mapInstance.setPitch(INITIAL_PITCH);

        mapInstance.on("zoom", () => {
          setKilometersPerPixel(
            (4007501.6686 *
              Math.abs(
                Math.cos((mapInstance.getCenter().lat * Math.PI) / 180),
              )) /
              Math.pow(2, mapInstance.getZoom() + 8),
          );
        });

        return () => {
          mapInstance.remove();
        };
      });
    }
  }, [userLogin]);

  useEffect(() => {
    if (map && map.isStyleLoaded()) {
      const isFireHistorySelected = selectedLayers.some(
        (layer) => layer.name === "Fire history",
      );

      if (isFireHistorySelected) {
        if (!map.getLayer("hotspot-heatmap-layer")) {
          addHotspotHeatmapLayer(map);
        }
        // Fly to the specified coordinates with zoom out
        map.flyTo({
          center: [-110.897, 31.259], // Longitude, Latitude
          zoom: 9, // Adjust this value for zoom out level
          speed: 0.8,
          curve: 1,
          easing(t) {
            return t;
          },
        });
      } else {
        if (map.getLayer("hotspot-heatmap-layer")) {
          map.removeLayer("hotspot-heatmap-layer");
        }
        if (map.getSource("hotspot-heatmap-source")) {
          map.removeSource("hotspot-heatmap-source");
        }
      }
    }
  }, [selectedLayers, map]);

  useEffect(() => {
    if (selectedCoordinates && map) {
      flyToLocation(selectedCoordinates, 15);
    }
  }, [selectedCoordinates, map, flyToLocation]);

  const handleLogin = () => {
    setIsUserLogin(true);
    setShowPopUp(true);
  };

  return (
    <>
      <Head>
        <title>Phoenix Eye | Wildfire Prediction</title>
        <meta name="description" content="Phoenix Eye—A NASA Space App Hackathon project that forecasts wildfires, alerts remote communities, and provides a comprehensive UI for researchers. " />
        <link rel="icon" href={PhoenixEyeLogo.src} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </Head>
      {!userLogin ? (
        <StartPage onLogin={handleLogin} />
      ) : (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#789]">
          {/* Background content */}
          <div
            className={`${
              showPopUp ? "pointer-events-none blur-sm" : ""
            } h-full w-full`}
          >
            <div id="map" style={{ width: "100%", height: "100vh" }}></div>
            <NavBar map={map} />
            {map && <Timeslider map={map} scale={kilometersPerPixel} />}
            {map && <ServicesLayer map={map} />}
            {map && <EmergencyAlerts map={map} onAlertClick={onAlertClick} />}
            <Image
              src={PhoenixEyeLogo}
              alt="Logo"
              width={100}
              height={100}
              className="z-1 absolute bottom-4 left-8"
            />
          </div>

          {/* Pop-up */}
          {showPopUp && (
            <div className="fixed inset-0 z-10">
              <PopUp onClose={() => setShowPopUp(false)} />
            </div>
          )}
        </main>
      )}
    </>
  );
}
