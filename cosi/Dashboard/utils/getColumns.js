import beautifyKey from "@shared/js/utils/beautifyKey.js";

/**
 *
 */
export default function getColumns (districtLevel, districtNames, colList) {
    const districts = districtLevel.displayAll
            ? districtLevel.districts
            : districtLevel.districts.filter(dist => districtNames.includes(dist.getName())),
        refDistrictNames = [];
    let district, refDistrictName;

    for (district of districts) {
        colList.push({
            text: beautifyKey(district.getLabel()),
            value: district.getLabel(),
            align: "end",
            district,
            districtLevel: districtLevel.label,
            sortable: false,
            groupable: false,
            selected: false,
            minimized: false
        });

        refDistrictName = district.getReferencDistrictName();

        if (refDistrictName) {
            refDistrictNames.push(refDistrictName);
        }
    }

    colList[colList.length - 1].divider = true;

    if (districtLevel.referenceLevel) {
        // add columns for reference areas
        getColumns(districtLevel.referenceLevel, refDistrictNames, colList);
    }

    return colList;
}
