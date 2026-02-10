import beautifyKey from "@shared/js/utils/beautifyKey.js";

/**
 *
 */
export default function getColumns (districtLevel, districtNames, colList, districtLevelCounter = 0) {
    const districts = districtLevel.displayAll
            ? districtLevel.districts
            : districtLevel.districts.filter(dist => districtNames.includes(dist.getName())),
        refDistrictNames = [];
    let district, refDistrictName;

    for (district of districts) {
        colList.push({
            text: beautifyKey(district.getLabel()),
            value: district.getLabel(),
            number: district.getNumber(),
            districtLevelIndex: districtLevelCounter,
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

    colList.sort((columnA, columnB) => {
        // sort by district level first
        if (columnA.districtLevelIndex !== columnB.districtLevelIndex) {
            return columnA.districtLevelIndex - columnB.districtLevelIndex;
        }
        // then sort by number
        return Number(columnA.number) - Number(columnB.number);
    });

    colList[colList.length - 1].divider = true;

    if (districtLevel.referenceLevel) {
        // add columns for reference areas
        getColumns(districtLevel.referenceLevel, refDistrictNames, colList, districtLevelCounter + 1);
    }

    return colList;
}
