type FontVariable = { variable: string };

// Local-safe fallback to avoid network fetches during production builds.
export const displayFont: FontVariable = { variable: "" };
export const bodyFont: FontVariable = { variable: "" };
export const monoFont: FontVariable = { variable: "" };
