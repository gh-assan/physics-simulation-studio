import {
  getLocation,
  encodeBase64,
  decodeBase64,
  hasOwnProperty
} from "../utils/StudioUtils";

describe("StudioUtils", () => {
  describe("getLocation", () => {
    it("should return window.location", () => {
      expect(getLocation()).toBe(window.location);
    });

    it("should return a Location object", () => {
      expect(getLocation()).toHaveProperty("href");
      expect(typeof getLocation().href).toBe("string");
    });

    it("should match window.location.href", () => {
      expect(getLocation().href).toBe(window.location.href);
    });
  });

  describe("encodeBase64", () => {
    it("should encode a string to Base64", () => {
      const input = "Hello, World!";
      const expected = "SGVsbG8sIFdvcmxkIQ==";
      expect(encodeBase64(input)).toBe(expected);
    });

    it("should handle empty strings", () => {
      expect(encodeBase64("")).toBe("");
    });
  });

  describe("decodeBase64", () => {
    it("should decode a Base64 string", () => {
      const input = "SGVsbG8sIFdvcmxkIQ==";
      const expected = "Hello, World!";
      expect(decodeBase64(input)).toBe(expected);
    });

    it("should handle empty strings", () => {
      expect(decodeBase64("")).toBe("");
    });
  });

  describe("hasOwnProperty", () => {
    it("should return true for own properties", () => {
      const obj = { a: 1, b: 2 };
      expect(hasOwnProperty(obj, "a")).toBe(true);
      expect(hasOwnProperty(obj, "b")).toBe(true);
    });

    it("should return false for non-existent properties", () => {
      const obj = { a: 1, b: 2 };
      expect(hasOwnProperty(obj, "c")).toBe(false);
    });

    it("should return false for inherited properties", () => {
      const obj = { a: 1, b: 2 };
      expect(hasOwnProperty(obj, "toString")).toBe(false);
    });
  });

  // Note: saveToFile and loadFromFile are not tested here because they interact with the DOM
  // and would require more complex testing setup with mocks for document.createElement, etc.
});
