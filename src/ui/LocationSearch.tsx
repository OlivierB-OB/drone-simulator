import { createSignal, onCleanup } from 'solid-js';
import { Combobox } from '@kobalte/core/combobox';
import { TbOutlineSearch } from 'solid-icons/tb';
import type { GeoCoordinates } from '../gis/GeoCoordinates';

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  onSelect: (geo: GeoCoordinates) => void;
};

export function LocationSearch(props: Props) {
  const [options, setOptions] = createSignal<NominatimResult[]>([]);
  const [value, setValue] = createSignal<NominatimResult | null>(null);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function onInputChange(value: string) {
    clearTimeout(debounceTimer);
    if (value.length < 3) {
      setOptions([]);
      return;
    }
    debounceTimer = setTimeout(async () => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      });
      const data: NominatimResult[] = await res.json();
      setOptions(data);
    }, 200);
  }

  function onChange(result: NominatimResult | null) {
    if (!result) return;
    props.onSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
    setValue(null);
    setOptions([]);
  }

  onCleanup(() => clearTimeout(debounceTimer));

  return (
    <Combobox<NominatimResult>
      options={options()}
      value={value()}
      onInputChange={onInputChange}
      onChange={onChange}
      defaultFilter={() => true}
      optionValue="display_name"
      optionLabel="display_name"
      optionTextValue="display_name"
      placeholder="Search location…"
      itemComponent={(itemProps) => (
        <Combobox.Item
          item={itemProps.item}
          class="px-3 py-2 text-sm text-gray-800 cursor-pointer data-[highlighted]:bg-gray-100 truncate"
        >
          <Combobox.ItemLabel>
            {itemProps.item.rawValue.display_name}
          </Combobox.ItemLabel>
        </Combobox.Item>
      )}
    >
      <Combobox.Control class="relative flex items-center">
        <TbOutlineSearch
          class="absolute left-2.5 text-gray-400 pointer-events-none"
          size={16}
        />
        <Combobox.Input class="w-[25vw] pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400" />
      </Combobox.Control>
      <Combobox.Portal>
        <Combobox.Content class="z-50 bg-white border border-gray-200 rounded-md shadow-lg mt-1 overflow-hidden animate-in fade-in-0 zoom-in-95">
          <Combobox.Listbox class="max-h-60 overflow-y-auto py-1" />
        </Combobox.Content>
      </Combobox.Portal>
    </Combobox>
  );
}
