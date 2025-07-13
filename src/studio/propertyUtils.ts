// Utility for filtering component keys
export function filterComponentKeys(keys: string[]): string[] {
  return keys.filter(
    (key) =>
      key !== "particles" &&
      key !== "springs" &&
      key !== "fixedParticles"
  );
}

// Utility for preparing component properties (stub for extensibility)
export function prepareComponentProperties(data: any): any[] {
  // Implement property inference logic here if needed
  return Object.keys(data).map((key) => ({ property: key, label: key }));
}
