import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import StreetSmartComponent from "../../../components/StreetSmart.vue";
import {expect} from "chai";
import sinon from "sinon";
import {nextTick} from "vue";

config.global.mocks.$t = key => key;

describe("addons/streetSmart/components/StreetSmart.vue", () => {
    let destroyApiSpy,
        initApiSpy,
        packagesLoaded,
        setPositionSpy,
        store,
        wrapper,
        currentLocale;

    beforeEach(() => {
        packagesLoaded = true;
        destroyApiSpy = sinon.spy();
        initApiSpy = sinon.spy();
        setPositionSpy = sinon.spy();
        currentLocale = sinon.spy();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StreetSmart: {
                            namespaced: true,
                            getters: {
                                packagesLoaded: () => packagesLoaded,
                                currentLocale: () => currentLocale
                            },
                            mutations: {
                                setPackagesLoaded: sinon.spy()
                            },
                            actions: {
                                destroyApi: destroyApiSpy,
                                loadPackages: sinon.spy(),
                                initApi: initApiSpy,
                                setPosition: setPositionSpy
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        clickCoordinate: () => [100, 200]
                    }
                }
            }
        });
    });


    it("renders the StreetSmart", () => {
        wrapper = shallowMount(StreetSmartComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#addons-street-smart").exists()).to.be.true;
    });
    it("should set to false destroyApi should be called", async () => {
        wrapper = shallowMount(StreetSmartComponent, {
            global: {
                plugins: [store]
            }
        });

        wrapper.unmount();
        await wrapper.vm.$nextTick();
        expect(destroyApiSpy.calledOnce).to.be.true;
    });

    it("should set to true initApi should be called", () => {
        wrapper = shallowMount(StreetSmartComponent, {
            global: {
                plugins: [store]
            }
        });

        nextTick(() => {
            expect(wrapper.find("#street-smart").exists()).to.be.true;
            expect(initApiSpy.calledOnce).to.be.true;
        });
    });
    it("if active is set to true, but api loading has not finished: initApi should not be called", async () => {
        packagesLoaded = false;

        wrapper = shallowMount(StreetSmartComponent, {
            global: {
                plugins: [store]
            }
        });

        nextTick(() => {
            expect(wrapper.find("#street-smart").exists()).to.be.true;
            expect(initApiSpy.notCalled).to.be.true;
        });
    });

    it("test watch on clickCoordinate should call action setPosition", () => {
        wrapper = shallowMount(StreetSmartComponent, {
            global: {
                plugins: [store]
            }
        });

        nextTick(() => {
            expect(wrapper.find("#street-smart").exists()).to.be.true;
            wrapper.vm.$options.watch.clickCoordinate.handler.call(wrapper.vm, [10, 20]);
            expect(setPositionSpy.called).to.be.true;
        });
    });
});
