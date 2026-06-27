/**
 * Returns the mapping of statistical data with groups (dividers and headers)
 * to render in vuetify select fields
 * the items of a group should be contiguous
 * @param {Object[]} mapping - the mapping array for statistical data
 * @returns {Object[]} the grouped mapping list
 */
export default function groupMapping (mapping) {
    return mapping.reduce((stats, el) => {
        if (stats.length === 0) {
            return [
                {
                    value: el.group,
                    type: "subheader",
                    title: el.group
                },
                el
            ];
        }
        if (stats[stats.length - 1]?.group !== el.group) {
            return [
                ...stats,
                {
                    type: "divider",
                    value: ""
                },
                {
                    value: el.group,
                    title: el.group,
                    type: "subheader"
                },
                el
            ];
        }

        return [...stats, el];
    }, []);
}
