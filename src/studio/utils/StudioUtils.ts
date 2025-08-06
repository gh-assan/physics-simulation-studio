// src/studio/utils/StudioUtils.ts

/**
 * Returns the window location object
 * @returns The window location object
 */
export const getLocation = () => window.location;

/**
 * Saves data to a file and triggers a download
 * @param data The data to save
 * @param filename The name of the file
 * @param mimeType The MIME type of the file
 */
export function saveToFile(
  data: string,
  filename: string,
  mimeType = "application/json"
): void {
  const blob = new Blob([data], { type: mimeType });
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  URL.revokeObjectURL(url);
}

/**
 * Loads data from a file selected by the user
 * @param acceptType The MIME type of the file to accept
 * @returns A promise that resolves with the file content
 */
export function loadFromFile(acceptType = "application/json"): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = acceptType;

    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(e.target?.result as string);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  });
}

/**
 * Encodes data to Base64
 * @param data The data to encode
 * @returns The Base64 encoded data
 */
export function encodeBase64(data: string): string {
  return btoa(data);
}

/**
 * Decodes Base64 data
 * @param encodedData The Base64 encoded data
 * @returns The decoded data
 */
export function decodeBase64(encodedData: string): string {
  return atob(encodedData);
}

/**
 * Checks if an object has a property
 * @param obj The object to check
 * @param prop The property to check for
 * @returns True if the object has the property, false otherwise
 */
export function hasOwnProperty(obj: object, prop: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
