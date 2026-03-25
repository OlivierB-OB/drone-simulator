import { SiGithub, SiOpenstreetmap, SiThreedotjs } from 'solid-icons/si';
import { TbOutlineMap } from 'solid-icons/tb';
import { Tooltip } from './Tooltip';
import { LocationSearch } from './LocationSearch';
import type { GeoCoordinates } from '../gis/GeoCoordinates';

type Props = {
  onLocationSelect: (geo: GeoCoordinates) => void;
};

export function Header(props: Props) {
  return (
    <header class="py-4 grid grid-cols-[1fr_auto_1fr] items-center px-6 bg-white text-gray-900 border-b border-gray-900 shrink-0">
      <span class="text-base font-semibold tracking-[0.04em]">
        OSM Drone Simulator
      </span>
      <LocationSearch onSelect={props.onLocationSelect} />
      <div class="flex justify-end gap-4">
        <Tooltip content="Map data © OpenStreetMap contributors">
          <a
            href="https://www.openstreetmap.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="OpenStreetMap"
            class="text-gray-900/70 no-underline flex items-center transition-colors duration-150 hover:text-gray-900"
          >
            <SiOpenstreetmap size={24} />
          </a>
        </Tooltip>
        <Tooltip content="Building & POI data from Overture Maps">
          <a
            href="https://overturemaps.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Overture Maps"
            class="text-gray-900/70 no-underline flex items-center transition-colors duration-150 hover:text-gray-900"
          >
            <TbOutlineMap size={24} />
          </a>
        </Tooltip>
        <Tooltip content="3D rendering powered by Three.js">
          <a
            href="https://threejs.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Three.js"
            class="text-gray-900/70 no-underline flex items-center transition-colors duration-150 hover:text-gray-900"
          >
            <SiThreedotjs size={24} />
          </a>
        </Tooltip>
        <Tooltip content="View source on GitHub">
          <a
            href="https://github.com/OlivierB-OB/osm-drone-simulator"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            class="text-gray-900/70 no-underline flex items-center transition-colors duration-150 hover:text-gray-900"
          >
            <SiGithub size={24} />
          </a>
        </Tooltip>
      </div>
    </header>
  );
}
