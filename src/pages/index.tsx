import Head from "next/head";
import { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"
import addCustomLayers from "~/utils/mapUtils/addCustomLayers"; 
import addCustomSources from "~/utils/mapUtils/addCustomSources";
import Timeslider from "~/Components/TimeSlider";
import NavBar from "~/Components/NavBar";

export default function Home() {
  const [kilometersPerPixel, setKilometersPerPixel] = useState(0);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiaGVjdG9yZ3R6MjciLCJhIjoiY2xuZ3dmc215MDc2ZDJqbWFydmszaTVxZCJ9.VjBUl1K3sWQTxY5pce434A";

    const map = new mapboxgl.Map({
      container: "map",
      projection: { name: "globe" },
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [-109.68775015454612, 30.375232671192375],
      zoom: 15,
    });

    setMap(map);

    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());

    map.on("style.load", () => {
      
      addCustomSources(map);
      addCustomLayers(map);

      map.setFog({
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(36, 92, 223)",
        "horizon-blend": 0.02,
        "space-color": "rgb(11, 11, 25)",
        "star-intensity": 0.6,
      });
      
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 });
      map.setPitch(60);
      
      map.on('zoom', () => {
        setKilometersPerPixel(4007501.6686 * Math.abs(Math.cos((map.getCenter().lat * Math.PI) / 180)) / Math.pow(2, map.getZoom() + 8));
      });
      
     return () => {
      map.remove();
    };
    });
  }, []);

  return (
    <>
      <Head>
        <title>Phoenix Eye</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#789]">
        <div id="map" style={{ width: "100%", height: "100vh"}}></div>
        {/* <div className="w-full h-full bg-[#777]" /> */}
        <NavBar/>
       <Timeslider map={map!} scale={kilometersPerPixel}/>
       <img src="/Phoenix-eye.png" className="absolute w-[8rem] h-[8rem] bottom-4 left-8 z-1" alt="Logo"/>
      </main>
    </>
  );
}
