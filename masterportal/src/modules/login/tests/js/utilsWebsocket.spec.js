import {describe, it, expect, beforeEach, vi} from "vitest";
import utilsWebsocket from "../../js/utilsWebsocket.js";
import Cookie from "../../js/utilsCookies.js";

describe("src/modules/login/js/utilsWebsocket", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("resolveWebsocketAuthUrl", () => {
        it("should prefer rhPath if configured", () => {
            expect(utilsWebsocket.resolveWebsocketAuthUrl({rhPath: "https://iot.example.com"})).toBe("https://iot.example.com");
        });

        it("should build websocket url from host and path", () => {
            const url = utilsWebsocket.resolveWebsocketAuthUrl({
                host: "iot.example.com",
                path: "/mqtt",
                protocol: "wss"
            });

            expect(url).toBe("wss://iot.example.com/mqtt");
        });

        it("should apply port option when host has no port", () => {
            const url = utilsWebsocket.resolveWebsocketAuthUrl({
                host: "wss://iot.example.com",
                path: "/mqtt",
                port: 8883
            });

            expect(url).toBe("wss://iot.example.com:8883/mqtt");
        });

        it("should not override port already present in host", () => {
            const url = utilsWebsocket.resolveWebsocketAuthUrl({
                host: "wss://iot.example.com:9001",
                path: "/mqtt",
                port: 8883
            });

            expect(url).toBe("wss://iot.example.com:9001/mqtt");
        });
    });

    describe("shouldAddWebsocketToken", () => {
        it("should return true for matching absolute urls", () => {
            const result = utilsWebsocket.shouldAddWebsocketToken(
                {rhPath: "https://iot.example.com/v1.1"},
                /^https:\/\/iot\.example\.com/
            );

            expect(result).toBe(true);
        });

        it("should return false if regex does not match", () => {
            const result = utilsWebsocket.shouldAddWebsocketToken(
                {rhPath: "https://other.example.com/v1.1"},
                /^https:\/\/iot\.example\.com/
            );

            expect(result).toBe(false);
        });
    });

    describe("getMqttAuthOptions", () => {
        it("should return mqtt auth options when token and regex match", () => {
            vi.spyOn(Cookie, "get").mockReturnValue("header.eyJzdWIiOiJ1dWlkLTEyMyJ9.sig");

            const auth = utilsWebsocket.getMqttAuthOptions(
                {rhPath: "https://iot.example.com/v1.1"},
                /^https:\/\/iot\.example\.com/
            );

            expect(auth).toEqual({
                username: "uuid-123",
                password: "header.eyJzdWIiOiJ1dWlkLTEyMyJ9.sig"
            });
        });

        it("should return empty object when token is missing", () => {
            vi.spyOn(Cookie, "get").mockReturnValue(null);

            const auth = utilsWebsocket.getMqttAuthOptions(
                {rhPath: "https://iot.example.com/v1.1"},
                /^https:\/\/iot\.example\.com/
            );

            expect(auth).toEqual({});
        });
    });

    describe("applyMqttAuthOptions", () => {
        it("should mutate mqtt options with auth credentials", () => {
            vi.spyOn(Cookie, "get").mockReturnValue("header.eyJzdWIiOiJ1dWlkLTEyMyJ9.sig");
            const options = {
                rhPath: "https://iot.example.com/v1.1"
            };

            const result = utilsWebsocket.applyMqttAuthOptions(options, /^https:\/\/iot\.example\.com/);

            expect(result).toBe(options);
            expect(options.username).toBe("uuid-123");
            expect(options.password).toBe("header.eyJzdWIiOiJ1dWlkLTEyMyJ9.sig");
        });

        it("should leave mqtt options untouched if no match", () => {
            vi.spyOn(Cookie, "get").mockReturnValue("header.eyJzdWIiOiJ1dWlkLTEyMyJ9.sig");
            const options = {
                rhPath: "https://other.example.com/v1.1"
            };

            const result = utilsWebsocket.applyMqttAuthOptions(options, /^https:\/\/iot\.example\.com/);

            expect(result).toBe(options);
            expect(options.username).toBeUndefined();
            expect(options.password).toBeUndefined();
        });
    });
});
