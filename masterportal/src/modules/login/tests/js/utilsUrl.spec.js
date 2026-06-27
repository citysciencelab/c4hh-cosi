import {describe, it, expect, beforeEach, vi} from "vitest";
import utilsUrl from "../../js/utilsUrl.js";
import Cookie from "../../js/utilsCookies.js";

describe("src/modules/login/js/utilsUrl", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("isUrlMatchingRegex", () => {
        it("should match regex patterns", () => {
            const pattern = /^https:\/\/[^.]+\.example\.com/;

            expect(utilsUrl.isUrlMatchingRegex("https://api.example.com/path", pattern)).toBe(true);
            expect(utilsUrl.isUrlMatchingRegex("https://other.com/path", pattern)).toBe(false);
        });

        it("should handle URL objects with toString()", () => {
            const urlObj = {toString: () => "https://example.com"};

            expect(utilsUrl.isUrlMatchingRegex(urlObj, "example.com")).toBe(true);
        });

        it("should return false for empty pattern", () => {
            expect(utilsUrl.isUrlMatchingRegex("https://example.com", "")).toBe(false);
        });
    });

    describe("isAbsoluteUrl", () => {
        it("should return true for absolute URLs", () => {
            expect(utilsUrl.isAbsoluteUrl("https://example.com/path")).toBe(true);
        });

        it("should return false for relative URLs starting with /", () => {
            expect(utilsUrl.isAbsoluteUrl("/api/data")).toBe(false);
        });

        it("should return false for relative URLs without /", () => {
            expect(utilsUrl.isAbsoluteUrl("api/data")).toBe(false);
            expect(utilsUrl.isAbsoluteUrl("./api")).toBe(false);
            expect(utilsUrl.isAbsoluteUrl("../api")).toBe(false);
        });

        it("should return false for invalid URLs", () => {
            expect(utilsUrl.isAbsoluteUrl(null)).toBe(false);
            expect(utilsUrl.isAbsoluteUrl(undefined)).toBe(false);
            expect(utilsUrl.isAbsoluteUrl("")).toBe(false);
        });

        it("should handle URL objects", () => {
            const urlObj = new URL("https://example.com");

            expect(utilsUrl.isAbsoluteUrl(urlObj)).toBe(true);
        });
    });

    describe("shouldAddToken", () => {
        it("should return false if no regex provided", () => {
            expect(utilsUrl.shouldAddToken("https://example.com", null)).toBe(false);
        });

        it("should return true for relative URLs regardless of regex", () => {
            const regex = /example\.com/;

            expect(utilsUrl.shouldAddToken("/api/data", regex)).toBe(true);
        });

        it("should check regex match for absolute URLs", () => {
            const regex = /^https:\/\/.*\.example\.com/;

            expect(utilsUrl.shouldAddToken("https://api.example.com/data", regex)).toBe(true);
            expect(utilsUrl.shouldAddToken("https://other.com/data", regex)).toBe(false);
        });
    });

    describe("getTokenHeader", () => {
        it("should return Bearer token when available", () => {
            vi.spyOn(Cookie, "get").mockReturnValue("my-token-123");
            expect(utilsUrl.getTokenHeader()).toBe("Bearer my-token-123");
        });

        it("should return null when token not available", () => {
            vi.spyOn(Cookie, "get").mockReturnValue(null);
            vi.spyOn(console, "warn").mockImplementation(() => { /* empty */ });

            expect(utilsUrl.getTokenHeader()).toBeNull();
        });

        it("should call Cookie.get with correct argument", () => {
            const spy = vi.spyOn(Cookie, "get").mockReturnValue("token");

            utilsUrl.getTokenHeader();
            expect(spy).toHaveBeenCalledWith("token");
        });
    });

    describe("getAuthToken", () => {
        it("should add Authorization header to config when token available", () => {
            vi.spyOn(Cookie, "get").mockReturnValue("my-token");
            const config = {headers: {}};

            const result = utilsUrl.getAuthToken(config);

            expect(result.headers.Authorization).toBe("Bearer my-token");
            expect(result.withCredentials).toBe(true);
        });

        it("should return config unchanged when no token available", () => {
            vi.spyOn(Cookie, "get").mockReturnValue(null);
            vi.spyOn(console, "warn").mockImplementation(() => { /* empty */ });
            const config = {headers: {}, someKey: "value"};

            const result = utilsUrl.getAuthToken(config);

            expect(result).toBe(config);
            expect(result.headers.Authorization).toBeUndefined();
        });

        it("should set withCredentials", () => {
            vi.spyOn(Cookie, "get").mockReturnValue("token");
            const config = {};

            const result = utilsUrl.getAuthToken(config);

            expect(result.withCredentials).toBe(true);
        });
    });
});
