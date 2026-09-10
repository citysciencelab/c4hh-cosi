import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import ShareViewComponent from "@modules/shareView/components/ShareView.vue";
import ShareView from "@modules/shareView/store/indexShareView.js";
import {expect} from "chai";
import sinon from "sinon";


describe("src/modules/shareView/components/ShareView.vue", () => {
    const mockConfigJson = {
            portalConfig: {
                navigationSecondary: {
                    sections: [
                        {
                            shareView: {
                                title: "Share",
                                icon: "bi-share",
                                itemType: "shareView",
                                facebookShare: true,
                                copyShare: true,
                                qrShare: true
                            }
                        }
                    ]
                }
            }
        },
        addSingleAlertSpy = sinon.spy();
    let defaultState,
        store,
        wrapper;

    beforeAll(() => {
        defaultState = {...ShareView.state};
    });

    beforeEach(() => {
        mapCollection.clear();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        ShareView: {
                            namespaced: true,
                            getters: {
                                url: () => sinon.stub(),
                                facebookShare: () => sinon.stub(),
                                copyShare: () => sinon.stub(),
                                qrShare: () => sinon.stub()
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        getView: sinon.stub()
                    },
                    actions: {}
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: addSingleAlertSpy
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            },
            getters: {
                visibleLayerConfigs: sinon.stub(),
                isMobile: sinon.stub()
            }
        });

    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    afterAll(() => {
        ShareView.state = defaultState;
    });

    it("renders the shareView component", () => {
        wrapper = shallowMount(ShareViewComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#share-view").exists()).to.be.true;
        expect(wrapper.find("#facebook-btn").exists()).to.be.true;
        expect(wrapper.find("#copy-btn").exists()).to.be.true;
        expect(wrapper.find("#qr-btn").exists()).to.be.true;
    });

    describe("copyToClipboard", () => {
        let originalSecureContextDescriptor,
            originalClipboardDescriptor,
            originalLocation;

        beforeAll(() => {
            originalSecureContextDescriptor = Object.getOwnPropertyDescriptor(window, "isSecureContext");
            originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
            originalLocation = global.location;
        });

        afterEach(() => {
            if (originalSecureContextDescriptor) {
                Object.defineProperty(window, "isSecureContext", originalSecureContextDescriptor);
            }
            else {
                delete window.isSecureContext;
            }

            if (originalClipboardDescriptor) {
                Object.defineProperty(navigator, "clipboard", originalClipboardDescriptor);
            }
            else {
                delete navigator.clipboard;
            }

            global.location = originalLocation;
        });

        it("copy to clipboard for secure websites", function () {
            let text = "";

            Object.defineProperty(window, "isSecureContext", {value: true, configurable: true});
            Object.defineProperty(navigator, "clipboard", {
                configurable: true,
                value: {
                    writeText: (aText) => {
                        text = aText;
                    }
                }});
            const writeTextStub = sinon.stub(navigator.clipboard, "writeText").resolves(text);

            wrapper = shallowMount(ShareViewComponent, {
                global: {
                    plugins: [store]
                }});

            wrapper.vm.copyToClipboard();

            expect(writeTextStub.calledOnceWithExactly("stub#")).to.be.true;
            expect(writeTextStub.callCount).to.equals(1);
        });

        it("draw an alert for unsecure websites", () => {
            Object.defineProperty(window, "isSecureContext", {value: false, configurable: true});
            wrapper = shallowMount(ShareViewComponent, {
                global: {
                    plugins: [store]
                }});

            wrapper.vm.copyToClipboard();

            expect(addSingleAlertSpy.callCount).to.equals(1);
            expect(addSingleAlertSpy.firstCall.args[1]).to.deep.equals({
                category: "error",
                content: "common:modules.shareView.copyErrorAlert"
            });
        });
        it("copies the URL with attached # to clipboard", function () {
            let text = "";

            Object.defineProperty(window, "isSecureContext", {value: true, configurable: true});
            Object.defineProperty(navigator, "clipboard", {
                configurable: true,
                value: {
                    writeText: (aText) => {
                        text = aText;
                    }
                }});
            const writeTextStub = sinon.stub(navigator.clipboard, "writeText").resolves(text);

            wrapper = shallowMount(ShareViewComponent, {
                global: {plugins: [store]}
            });

            wrapper.vm.copyToClipboard();

            expect(writeTextStub.calledOnceWithExactly("stub#")).to.be.true;
            expect(writeTextStub.callCount).to.equals(1);
        });

        it("includes existing URL parameters in the share URL", () => {
            const mockLayerUrlParams = [
                    {id: "layer1", visibility: true},
                    {id: "layer2", visibility: false}
                ],
                mockMapUrlParams = "MAP=mapValue",
                mockMenuUrlParams = {
                    main: {
                        currentComponent: "root"
                    },
                    secondary: {
                        currentComponent: "root"
                    }
                },
                mockAddonUrlParams = "ADDONPARAM=addonValue",
                rootGetters = {
                    layerUrlParams: mockLayerUrlParams,
                    "Maps/urlParams": mockMapUrlParams,
                    "Menu/urlParams": mockMenuUrlParams
                },
                state = {},
                getters = {},
                expectedURL = "https://self.example.org/portal/?MAP=mapValue&MENU={\"main\":{\"currentComponent\":\"root\"},\"secondary\":{\"currentComponent\":\"root\"}}&LAYERS=[{\"id\":\"layer1\",\"visibility\":true},{\"id\":\"layer2\",\"visibility\":false}]&ADDONPARAM=addonValue";

            global.location = {
                ...originalLocation,
                origin: "https://self.example.org",
                pathname: "/portal/",
                search: mockAddonUrlParams
            };

            expect(decodeURI(ShareView.getters.url(state, getters, {}, rootGetters))).to.equal(expectedURL);
        });
        it("ignore existing basic URL parameters in the share URL", () => {
            const mockLayerUrlParams = [
                    {id: "layer1", visibility: true},
                    {id: "layer2", visibility: false}
                ],
                mockMapUrlParams = "MAP=mapValue",
                mockMenuUrlParams = {
                    main: {
                        currentComponent: "root"
                    },
                    secondary: {
                        currentComponent: "root"
                    }
                },
                mockExistingParams = "MAP=oldMapValue&LAYERS=oldLayerValue&MENU=oldMenuValue&ADDONPARAM=addonValue",
                rootGetters = {
                    layerUrlParams: mockLayerUrlParams,
                    "Maps/urlParams": mockMapUrlParams,
                    "Menu/urlParams": mockMenuUrlParams
                },
                state = {},
                getters = {},
                expectedURL = "https://self.example.org/portal/?MAP=mapValue&MENU={\"main\":{\"currentComponent\":\"root\"},\"secondary\":{\"currentComponent\":\"root\"}}&LAYERS=[{\"id\":\"layer1\",\"visibility\":true},{\"id\":\"layer2\",\"visibility\":false}]&ADDONPARAM=addonValue";

            global.location = {
                ...originalLocation,
                origin: "https://self.example.org",
                pathname: "/portal/",
                search: mockExistingParams
            };

            expect(decodeURI(ShareView.getters.url(state, getters, {}, rootGetters))).to.equal(expectedURL);
        });
    });

});
