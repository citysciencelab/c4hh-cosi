import getBasicInfo from "../../../js/getBasicInfo";
import sinon from "sinon";
import {expect} from "chai/index";

describe("addons/cosi/TemplateManager/js/getBasicInfo", () => {
    describe("getOverviewBasicInfo", () => {
        it("should get basic overview info", () => {
            const selectedDistrictLevel = {
                    label: "level-z",
                    districts: [
                        {getName: () => "foo-from-level-z", isSelected: true, getReferencDistrictName: () => "foo-parent", adminFeature: {
                            getGeometry: () => {
                                return {
                                    getArea: () => 50000
                                };
                            }
                        }},
                        {getName: () => "foo1-from-level-z", isSelected: true, getReferencDistrictName: () => "foo1-parent", adminFeature: {
                            getGeometry: () => {
                                return {
                                    getArea: () => 50000
                                };
                            }
                        }}
                    ]
                },
                levelInfo = [
                    {"level-z": {"foo-from-level-z": true, "foo1-from-level-z": true}},
                    {"level-y": {"foo-parent": true}}
                ],
                expected = [
                    {label: "level-y", value: "foo-parent"},
                    {label: "level-z", value: "foo-from-level-z, foo1-from-level-z"},
                    {label: "Größe", value: "10 ha"}
                ];

            sinon.stub(getBasicInfo, "getLevelInfos").returns(levelInfo);
            expect(getBasicInfo.getOverviewBasicInfo(selectedDistrictLevel)).to.deep.equal(expected);
            sinon.restore();
        });
    });
    describe("getLevelInfos", () => {
        it("should return an array with object which holds infos", () => {
            const selectedDistrictLevel = {
                    label: "level-z",
                    districts: [
                        {getName: () => "foo-from-level-z", isSelected: true},
                        {getName: () => "foo1-from-level-z", isSelected: false}
                    ]
                },
                expected = [
                    {"level-z": {"foo-from-level-z": true}}
                ];

            expect(getBasicInfo.getLevelInfos(selectedDistrictLevel, [])).to.deep.equal(expected);
        });
        it("should return an array with object which holds infos of child and matching parent infos and should ignore isSelected on parent", () => {
            const selectedDistrictLevel = {
                    label: "level-z",
                    districts: [
                        {getName: () => "foo-from-level-z", isSelected: true, getReferencDistrictName: () => "foo-parent"},
                        {getName: () => "foo1-from-level-z", isSelected: false, getReferencDistrictName: () => "foo1-parent"}
                    ],
                    referenceLevel: {
                        label: "level-y",
                        districts: [
                            {getName: () => "foo-parent"},
                            {getName: () => "foo1-parent"}
                        ]
                    }
                },
                expected = [
                    {"level-z": {"foo-from-level-z": true}},
                    {"level-y": {"foo-parent": true}}
                ];

            expect(getBasicInfo.getLevelInfos(selectedDistrictLevel, [])).to.deep.equal(expected);
        });
    });
});
