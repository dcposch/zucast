export const COOKIE_ZUCAST_TOKEN = "zucastToken";

export const EXTERNAL_NULLIFIER = BigInt(42);

export const MAX_POST_LENGTH = 280;

export const RATE_LIMIT_ACTIONS_PER_HOUR = 1000;

export const PROFILE_COLORS = (function () {
  const colors: string[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 8; j++) {
      const hue = j === 7 ? 0 : j * 48;
      const sat = j === 7 ? 0 : 60 - i * 10;
      const light = 85 - i * 10;
      colors.push(`hsl(${hue}, ${sat}%, ${light}%)`);
    }
  }
  return colors;
})();
