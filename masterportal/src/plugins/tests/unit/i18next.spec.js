import {expect} from "chai";
import sinon from "sinon";
import {beforeEach, describe, it, vi} from "vitest";
import {initLanguage, initiateVueI18Next, normalizeLanguageCode} from "@plugins/i18next.js";

vi.mock("i18next", () => ({
    default: {}
}));

vi.mock("i18next-browser-languagedetector", () => ({
    default: sinon.stub()
}));

vi.mock("i18next-http-backend", () => ({
    default: sinon.stub()
}));

vi.mock("i18next-vue", () => ({
    default: sinon.stub()
}));

describe("src/plugins/i18next.js", () => {
    describe("initiateVueI18Next", () => {
        let i18nextMock;
        let i18nextVueMock;

        beforeEach(async () => {
            const i18nextModule = await vi.importMock("i18next");
            const i18nextVueModule = await vi.importMock("i18next-vue");

            i18nextMock = i18nextModule.default;
            i18nextVueMock = i18nextVueModule.default;
        });

        it("should call app.use exactly once with the correct arguments", () => {
            const mockApp = {use: sinon.spy()};

            initiateVueI18Next(mockApp);

            expect(mockApp.use.calledOnce).to.be.true;
            expect(mockApp.use.getCall(0).args[0]).to.equal(i18nextVueMock);
            expect(mockApp.use.getCall(0).args[1]).to.deep.equal({i18next: i18nextMock});
        });
    });

    describe("initLanguage", () => {
        let i18nextMock;
        let windowLocationStub;

        beforeEach(async () => {
            const i18nextModule = await vi.importMock("i18next");

            i18nextMock = i18nextModule.default;
            i18nextMock.addResourceBundle = sinon.stub();
            i18nextMock.changeLanguage = sinon.stub().resolves();
            i18nextMock.init = sinon.stub().resolves();
            i18nextMock.on = sinon.stub().returnsThis();
            i18nextMock.use = sinon.stub().returnsThis();

            windowLocationStub = {
                hostname: "example.com",
                pathname: "/de/portal/123"
            };

            sinon.stub(window, "location").value(windowLocationStub);

            global.MASTERPORTAL_BASE_PATH = "/";
            global.Config = {
                portalLanguage: {
                    enabled: false
                }
            };

            Object.defineProperty(i18nextMock, "language", {
                configurable: true,
                value: "de"
            });
        });

        afterAll(() => {
            delete global.MASTERPORTAL_BASE_PATH;
            delete global.Config;
        });

        it("should initialize i18next with default configuration", async () => {
            const result = await initLanguage({}, undefined);

            expect(i18nextMock.use.called).to.be.true;
            expect(i18nextMock.init.called).to.be.true;
            expect(result.basePath).to.equal("/");
            expect(result.portalId).to.equal("portal");
            expect(result.portalLanguage.fallbackLanguage).to.equal("de");
            expect(result.portalLanguage.loadPath).to.equal("/locales/{{lng}}/{{ns}}.json");
        });

        it("should return derived portalId from URL pathname", async () => {
            windowLocationStub.pathname = "/example/portal/456";

            const result = await initLanguage({}, undefined);

            expect(i18nextMock.init.called).to.be.true;
            expect(result.portalId).to.equal("portal");
        });

        it("should return hostname-based portalId as fallback", async () => {
            windowLocationStub.pathname = "/";
            windowLocationStub.hostname = "myportal.example.com";

            const result = await initLanguage({}, undefined);

            expect(i18nextMock.init.called).to.be.true;
            expect(result.portalId).to.equal("myportal");
        });

        it("should return configured basePath when MASTERPORTAL_BASE_PATH is provided", async () => {
            global.MASTERPORTAL_BASE_PATH = "/masterportal/";

            const result = await initLanguage({}, undefined);

            expect(i18nextMock.init.called).to.be.true;
            expect(result.basePath).to.equal("/masterportal/");
            expect(result.portalLanguage.loadPath).to.equal("/masterportal/locales/{{lng}}/{{ns}}.json");
        });

        it("should add trailing slash to basePath if missing", async () => {
            global.MASTERPORTAL_BASE_PATH = "/masterportal";

            const result = await initLanguage({}, undefined);

            expect(i18nextMock.init.called).to.be.true;
            expect(result.basePath).to.equal("/masterportal/");
            expect(result.portalLanguage.loadPath).to.equal("/masterportal/locales/{{lng}}/{{ns}}.json");
        });

        it("should merge portalLanguageConfig with defaults", async () => {
            const portalLanguageConfig = {
                enabled: true,
                debug: true,
                languages: {
                    de: "deutsch",
                    en: "english",
                    fr: "francais"
                },
                fallbackLanguage: "en"
            };

            const result = await initLanguage(portalLanguageConfig, undefined);

            const initConfig = i18nextMock.init.getCall(0).args[0];

            expect(i18nextMock.init.called).to.be.true;
            expect(initConfig.debug).to.equal(true);
            expect(initConfig.fallbackLng).to.equal("en");
            expect(initConfig.supportedLngs).to.include("de");
            expect(initConfig.supportedLngs).to.include("en");
            expect(initConfig.supportedLngs).to.include("fr");
            expect(result.portalLanguage.enabled).to.be.true;
            expect(result.portalLanguage.debug).to.be.true;
            expect(result.portalLanguage.fallbackLanguage).to.equal("en");
            expect(result.portalLanguage.languages).to.deep.equal(portalLanguageConfig.languages);
        });

        it("should keep default language detection order in returned portalLanguage", async () => {
            const result = await initLanguage({}, undefined);
            const initConfig = i18nextMock.init.getCall(0).args[0];

            expect(result.portalLanguage.changeLanguageOnStartWhen).to.deep.equal([
                "querystring",
                "localStorage",
                "navigator",
                "htmlTag"
            ]);
            expect(initConfig.detection.order).to.deep.equal(result.portalLanguage.changeLanguageOnStartWhen);
        });

        it("should expose custom detection order in returned portalLanguage", async () => {
            const portalLanguageConfig = {
                changeLanguageOnStartWhen: ["querystring", "navigator"]
            };

            const result = await initLanguage(portalLanguageConfig, undefined);
            const initConfig = i18nextMock.init.getCall(0).args[0];

            expect(result.portalLanguage.changeLanguageOnStartWhen).to.deep.equal(["querystring", "navigator"]);
            expect(initConfig.detection.order).to.deep.equal(["querystring", "navigator"]);
        });

        it("should set fallback language to 'de' by default", () => {
            initLanguage({}, undefined);

            const initConfig = i18nextMock.init.getCall(0).args[0];

            expect(initConfig.fallbackLng).to.equal("de");
        });

        it("should set backend loadPath from config", () => {
            const portalLanguageConfig = {
                loadPath: "/custom/path/{{lng}}/{{ns}}.json"
            };

            initLanguage(portalLanguageConfig, undefined);

            const initConfig = i18nextMock.init.getCall(0).args[0];

            expect(initConfig.backend.loadPath).to.equal("/custom/path/{{lng}}/{{ns}}.json");
        });

        it("should add portal-specific locale overrides", async () => {
            const portalLocales = {
                de: {
                    common: {
                        "key1": "Wert1",
                        "key2": "Wert2"
                    }
                },
                en: {
                    common: {
                        "key1": "Value1",
                        "key2": "Value2"
                    }
                }
            };

            initLanguage({}, portalLocales);

            await i18nextMock.init.getCall(0).returnValue;

            expect(i18nextMock.addResourceBundle.called).to.be.true;
            expect(i18nextMock.addResourceBundle.callCount).to.equal(2);
        });

        it("should change language to 'de' in initialized callback if switch is disabled", () => {
            global.Config.portalLanguage.enabled = false;
            const portalLanguageConfig = {enabled: false};

            initLanguage(portalLanguageConfig, undefined);

            const initializedCallback = i18nextMock.on.getCall(0).args[1];

            initializedCallback();

            expect(i18nextMock.changeLanguage.calledOnceWithExactly("de")).to.be.true;
        });

        it("should not change language in initialized callback if switch is enabled", () => {
            const portalLanguageConfig = {enabled: true};

            initLanguage(portalLanguageConfig, undefined);

            const initializedCallback = i18nextMock.on.getCall(0).args[1];

            initializedCallback();

            expect(i18nextMock.changeLanguage.called).to.be.false;
        });

        it("should strip common: prefix in parseMissingKeyHandler", () => {
            initLanguage({}, undefined);

            const initConfig = i18nextMock.init.getCall(0).args[0];
            const handler = initConfig.parseMissingKeyHandler;
            const result = handler("common:test.key");

            expect(result).to.equal("test.key");
        });

        it("should strip additional: prefix in parseMissingKeyHandler", () => {
            initLanguage({}, undefined);

            const initConfig = i18nextMock.init.getCall(0).args[0];
            const handler = initConfig.parseMissingKeyHandler;
            const result = handler("additional:test.key");

            expect(result).to.equal("test.key");
        });

        it("should convert time format HH.MM to HH:MM in parseMissingKeyHandler", () => {
            initLanguage({}, undefined);

            const initConfig = i18nextMock.init.getCall(0).args[0];
            const handler = initConfig.parseMissingKeyHandler;
            const result = handler("Time 14.30 is valid");

            expect(result).to.equal("Time 14:30 is valid");
        });

        it("should return key unchanged when it has no prefix and no time format", () => {
            initLanguage({}, undefined);

            const handler = i18nextMock.init.getCall(0).args[0].parseMissingKeyHandler;

            expect(handler("just.a:key")).to.equal("just.a:key");
        });

        it("should process multiple portal locales correctly", async () => {
            const portalLocales = {
                de: {
                    common: {"key": "Wert"},
                    "namespace2": {"key": "Wert2"}
                },
                en: {
                    common: {"key": "Value"},
                    "namespace2": {"key": "Value2"}
                }
            };

            initLanguage({}, portalLocales);

            await i18nextMock.init.getCall(0).returnValue;

            expect(i18nextMock.addResourceBundle.callCount).to.equal(4);
        });

        it("should handle empty portalLanguageConfig", () => {
            initLanguage({}, undefined);

            expect(i18nextMock.init.called).to.be.true;
            const initConfig = i18nextMock.init.getCall(0).args[0];

            expect(initConfig.supportedLngs).to.include("de");
            expect(initConfig.supportedLngs).to.include("en");
        });

        it("getLanguages should return configured languages", () => {
            const portalLanguageConfig = {
                languages: {
                    de: "deutsch",
                    en: "english"
                }
            };

            initLanguage(portalLanguageConfig, undefined);

            const initConfig = i18nextMock.init.getCall(0).args[0];
            const languages = initConfig.getLanguages();

            expect(languages).to.deep.equal({
                de: "deutsch",
                en: "english"
            });
        });

        it("should handle lookupLocalStorage key generation", () => {
            windowLocationStub.pathname = "/de/myportal/123";
            initLanguage({}, undefined);

            const initConfig = i18nextMock.init.getCall(0).args[0];

            expect(initConfig.detection.lookupLocalStorage).to.include("myportal");
        });

        it("should not call addResourceBundle when portalLocales is null", async () => {
            initLanguage({}, null);

            await i18nextMock.init.getCall(0).returnValue;

            expect(i18nextMock.addResourceBundle.called).to.be.false;
        });

        it("should call addResourceBundle with correct arguments", async () => {
            const portalLocales = {
                de: {
                    common: {"key": "Wert"}
                }
            };

            initLanguage({}, portalLocales);

            await i18nextMock.init.getCall(0).returnValue;

            const [lang, ns, resources, deep, overwrite] = i18nextMock.addResourceBundle.getCall(0).args;

            expect(lang).to.equal("de");
            expect(ns).to.equal("common");
            expect(resources).to.deep.equal({"key": "Wert"});
            expect(deep).to.be.true;
            expect(overwrite).to.be.true;
        });
    });

    describe("normalizeLanguageCode", () => {
        const fallbackLanguage = "de";
        const languages = {de: "deutsch", en: "english"};
        let i18nextMock;

        beforeEach(async () => {
            const i18nextModule = await vi.importMock("i18next");

            i18nextMock = i18nextModule.default;
            i18nextMock.changeLanguage = sinon.stub().resolves();

            Object.defineProperty(i18nextMock, "language", {
                configurable: true,
                value: "de"
            });
        });

        it("should not call changeLanguage if the detected language code has no region suffix", () => {
            Object.defineProperty(i18nextMock, "language", {
                configurable: true,
                value: "de"
            });

            normalizeLanguageCode({fallbackLanguage, languages});

            expect(i18nextMock.changeLanguage.called).to.be.false;
        });

        it("should change to the base language if it is supported and a region suffix is detected", () => {
            Object.defineProperty(i18nextMock, "language", {
                configurable: true,
                value: "en-US"
            });

            normalizeLanguageCode({fallbackLanguage, languages});

            expect(i18nextMock.changeLanguage.calledOnceWithExactly("en")).to.be.true;
        });

        it("should change to the fallback language if the base language is not supported", () => {
            Object.defineProperty(i18nextMock, "language", {
                configurable: true,
                value: "fr-FR"
            });

            normalizeLanguageCode({fallbackLanguage, languages});

            expect(i18nextMock.changeLanguage.calledOnceWithExactly(fallbackLanguage)).to.be.true;
        });

        it("should use only the first segment of a multi-part language code (e.g. de-Latn-DE)", () => {
            Object.defineProperty(i18nextMock, "language", {
                configurable: true,
                value: "de-Latn-DE"
            });

            normalizeLanguageCode({fallbackLanguage, languages});

            expect(i18nextMock.changeLanguage.calledOnceWithExactly("de")).to.be.true;
        });

        it("should use fallback language when languages object is empty", () => {
            Object.defineProperty(i18nextMock, "language", {
                configurable: true,
                value: "en-US"
            });

            normalizeLanguageCode({fallbackLanguage, languages: {}});

            expect(i18nextMock.changeLanguage.calledOnceWithExactly(fallbackLanguage)).to.be.true;
        });
    });
});
