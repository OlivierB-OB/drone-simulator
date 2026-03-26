import { Dialog } from '@kobalte/core/dialog';
import { createSignal, For } from 'solid-js';
import { TbOutlineX, TbOutlineRefresh } from 'solid-icons/tb';
import {
  getRandomPlaces,
  type InterestingPlace,
} from '../data/places/interestingPlaces';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaceSelect: (place: InterestingPlace) => void;
};

export function PlacesModal(props: Props) {
  const [places, setPlaces] = createSignal(getRandomPlaces(5));

  const handleRefresh = () => setPlaces(getRandomPlaces(5));

  const handlePlaceClick = (place: InterestingPlace) => {
    props.onPlaceSelect(place);
    props.onOpenChange(false);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto animate-in fade-in-0 zoom-in-95">
          <div class="flex justify-between items-center mb-4">
            <Dialog.Title class="text-lg font-semibold text-gray-900">
              Discover Interesting Places
            </Dialog.Title>
            <Dialog.CloseButton class="text-gray-500 hover:text-gray-900 transition-colors">
              <TbOutlineX size={20} />
            </Dialog.CloseButton>
          </div>

          <div class="space-y-3 mb-4">
            <For each={places()}>
              {(place) => (
                <div
                  onClick={() => handlePlaceClick(place)}
                  class="p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium text-gray-900">{place.name}</h3>
                    <span class="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded capitalize">
                      {place.subcategory.replace(/-/g, ' ')}
                    </span>
                  </div>
                  {place.description && (
                    <p class="text-sm text-gray-600">{place.description}</p>
                  )}
                  <p class="text-xs text-gray-500 mt-2">
                    {place.lat.toFixed(4)}°, {place.lng.toFixed(4)}° •{' '}
                    {place.elevation}m
                  </p>
                </div>
              )}
            </For>
          </div>

          <button
            onClick={handleRefresh}
            class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <TbOutlineRefresh size={18} />
            Show Different Places
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
