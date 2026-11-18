/**
 * Builds a filter string for OAF queries based on the provided filters and parameters.
 * @param {Object} filters - The filter configuration.
 * @param {Object} params - The parameters for filtering.
 * @returns {string} The constructed filter string.
 */
export default function buildOafFilterString (filters, params) {
    const filterStrings = [];

    if (params.startDate && params.endDate) {
        const dateField = filters.dateRangeField;

        filterStrings.push(`(${dateField} >= DATE('${params.startDate}') AND ${dateField} <= DATE('${params.endDate}'))`);
    }

    if (params.textValue) {
        const textFilter = filters.textSearchFields
            .map(field => `CASEI(${field}) LIKE CASEI('%${params.textValue}%')`)
            .join(" OR ");

        filterStrings.push(`(${textFilter})`);
    }

    if (params.selectedFilters) {
        filters.select.forEach(select => {
            const selection = params.selectedFilters[select.field];
            let selectedValues = [];

            if (select.multiple && Array.isArray(selection) && selection.length > 0) {
                selectedValues = selection;
            }
            else if (!select.multiple && selection !== null && selection !== undefined && selection !== "") {
                selectedValues = [selection];
            }

            const validValues = selectedValues.filter(value => select.options.some(option => option.value === value)
            );

            if (validValues.length > 0) {
                const expressions = validValues.map(value => `${select.field} = '${String(value).replaceAll("'", "''")}'`
                );

                filterStrings.push(`(${expressions.join(" OR ")})`);
            }
        });
    }

    return filterStrings.join(" AND ");
}
