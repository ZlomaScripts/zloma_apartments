import { assertResourceName } from '@/resourceName';
assertResourceName();

// The built-in WiWang photo ships with the resource, so NUI never needs to
// hotlink its Imgur copy. Other configured room/building URLs remain remote.
export const WIWANG_IMAGE_URL = 'https://i.imgur.com/LLmvFYq.jpeg';
export function roomImageSource(url?: string): string | undefined {
  const value = url?.trim();
  return value === WIWANG_IMAGE_URL ? './images/wiwang-room.jpg' : value || undefined;
}
