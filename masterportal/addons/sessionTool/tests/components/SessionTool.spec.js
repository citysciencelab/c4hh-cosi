import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import SessionTool from "../../components/SessionTool.vue";
import SessionToolModule from "../../store/indexSessionTool.js";

config.global.mocks.$t = key => key;

describe("src/modules/tools/sessionTool/components/sessionTool.vue", () => {
    let wrapper, store, addSingleAlertStub;

    beforeEach(() => {
        addSingleAlertStub = sinon.stub();
        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        SessionTool: SessionToolModule
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: addSingleAlertStub
                    }
                }
            }
        });
        wrapper = shallowMount(SessionTool, {
            global: {
                plugins: [store]
            }
        });
        sinon.stub(console, "warn").callsFake(sinon.spy());
    });


    describe("Render DOM", () => {
        it("should render correctly", () => {
            expect(wrapper.find("div").classes("session-tool")).to.be.true;
        });
        it("should render the download button", () => {
            expect(wrapper.find("#fileUpload").exists()).to.be.true;
        });
        it("should render the upload button", () => {
            expect(wrapper.find("#fileDownload").exists()).to.be.true;
        });
    });
    describe("User Interaction", () => {
        it("should trigger download if button is clicked", () => {
            const stubDownloadFile = sinon.stub(SessionTool.methods, "downloadFile");

            wrapper = shallowMount(SessionTool, {
                global: {
                    plugins: [store]
                }
            });
            wrapper.find("#fileDownload").trigger("click");
            expect(stubDownloadFile.called).to.be.true;
            sinon.restore();
        });
        it("should trigger upload if button is clicked", () => {
            const stubTriggerUpload = sinon.stub(SessionTool.methods, "triggerUpload");

            wrapper = shallowMount(SessionTool, {
                global: {
                    plugins: [store]
                }
            });
            wrapper.find("#fileUpload").trigger("click");
            expect(stubTriggerUpload.called).to.be.true;
            sinon.restore();
        });
    });
    describe("Methods", () => {
        describe("downloadFile", () => {
            it("should not call createFile function if given param is not an array", () => {
                const stubCreateFile = sinon.stub(SessionTool.methods, "createFile");

                wrapper = shallowMount(SessionTool, {
                    global: {
                        plugins: [store]
                    }
                });
                wrapper.vm.downloadFile(undefined);
                expect(stubCreateFile.called).to.be.false;
                wrapper.vm.downloadFile({});
                expect(stubCreateFile.called).to.be.false;
                wrapper.vm.downloadFile(null);
                expect(stubCreateFile.called).to.be.false;
                wrapper.vm.downloadFile(1234);
                expect(stubCreateFile.called).to.be.false;
                wrapper.vm.downloadFile("string");
                expect(stubCreateFile.called).to.be.false;
                wrapper.vm.downloadFile(true);
                expect(stubCreateFile.called).to.be.false;
                wrapper.vm.downloadFile(false);
                expect(stubCreateFile.called).to.be.false;
                sinon.restore();
            });
            it("should call createFile function if given param is an array", () => {
                const stubCreateFile = sinon.stub(SessionTool.methods, "createFile");

                wrapper = shallowMount(SessionTool, {
                    global: {
                        plugins: [store]
                    }
                });
                wrapper.vm.downloadFile([]);
                expect(stubCreateFile.called).to.be.true;
                sinon.restore();
            });
            it("should call createFile function if given param is an array with object but has no getter function", () => {
                const stubCreateFile = sinon.stub(SessionTool.methods, "createFile");

                wrapper = shallowMount(SessionTool, {
                    global: {
                        plugins: [store]
                    }
                });
                wrapper.vm.downloadFile([{}]);
                expect(stubCreateFile.called).to.be.true;
                sinon.restore();
            });
            it("should call createFile function with expected blob if given param is an array and object has a getter function", () => {
                const stubCreateFile = sinon.stub(SessionTool.methods, "createFile"),
                    observer = [
                        {
                            key: "boo",
                            getter: () => "foo"
                        }
                    ],
                    expectedBlob = new Blob([JSON.stringify({
                        state: {
                            "boo": "foo"
                        }
                    })], {type: "application/json;"});

                wrapper = shallowMount(SessionTool, {
                    global: {
                        plugins: [store]
                    }
                });
                wrapper.vm.downloadFile(observer);
                expect(stubCreateFile.calledWithExactly(expectedBlob, "session.masterportal"));
                sinon.restore();
            });
        });
        describe("onFileLoad", () => {
            it("should throw an error if the given param is not an parsable object or array", () => {
                wrapper.vm.onFileLoad(undefined);
                expect(addSingleAlertStub.called).to.be.true;
                sinon.restore();
            });
            it("should call the close function if given param is a parsable json string which also has a state property", () => {
                const spySetObserver = sinon.spy(SessionTool.methods, "setObserver");

                wrapper = shallowMount(SessionTool, {
                    global: {
                        plugins: [store]
                    }
                });
                wrapper.vm.onFileLoad(JSON.stringify({state: {}}));
                expect(spySetObserver.called).to.be.true;
                sinon.restore();
            });
            it("should handle 3d mode map differently", async () => {
                let setObserverSpy = null;

                wrapper.vm.setObserver([{key: "foo", setter: "bar"}, {key: "Maps", setter: "bar"}]);
                setObserverSpy = sinon.spy(wrapper.vm, "setObserver");
                await wrapper.vm.$nextTick();
                wrapper.vm.onFileLoad(JSON.stringify({state: {Maps: {mode: "3D"}, Modeler3D: "foo"}}));
                await wrapper.vm.$nextTick();
                expect(setObserverSpy.callCount).to.be.equal(2);
                sinon.restore();
            });
        });
    });
});
