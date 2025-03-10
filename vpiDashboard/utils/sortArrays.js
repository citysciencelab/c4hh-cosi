const sortArrays = {
    /**
     * Sorts the gender data array
     * @param {Array} arr gender data
     * @return {Array} the sorted array
     */
    sortGenderArray: (arr) => {
        // eslint-disable-next-line
        const numericalOrder = (range) => {
            if (range.includes("+")) {
                return Infinity;
            }
            const [min, max] = range.split("-");

            return (Number(min) + Number(max)) / 2;
        };

        arr?.sort((a, b) => numericalOrder(a) - numericalOrder(b));

        return arr ? arr : [];
    },
    /**
     * Sorts the age groups data array
     * @param {Array} arr age groups data
     * @return {Array} the sorted array
     */
    sortAgeGroupsArray: (arr) => {
        // eslint-disable-next-line
        const numericalOrder = (range) => {
            if (range.includes(">")) {
                return parseInt(range.slice(1), 10) + 1;
            }
            const [min, max] = range.slice(1, -1).split("-");

            return (Number(min) + Number(max)) / 2;
        };

        arr?.sort((a, b) => numericalOrder(a) - numericalOrder(b));
        // eslint-disable-next-line
        arr = arr ? arr.map((range) => range.replace(/[[\]]/g, "")) : []; // Remove brackets

        return arr;
    }
};

export default sortArrays;
