/**
 * @class RegexConverter
 */
export class RegexConverter {
    /**
     * Creates an instance of RegexConverter.
     * @param {*} regexp regexp
     * @param {*} extractor extractor
     * @memberof RegexConverter
     */
    constructor (regexp, extractor) {
        this.regexp = new RegExp(regexp);
        this.extractor = extractor;
    }

    /**
     * @param {*} str string
     * @return {*} value
     */
    convert (str) {
        const m = this.regexp.exec(str);

        if (m === null) {
            return null;
        }

        return this.extractor(m);
    }
}

/**
 * @class DbRangeConverter
 */
export class DbRangeConverter {
    /**
     * Creates an instance of RegexConverter.
     * @param {*} regexp regexp
     * @param {*} extractor extractor
     * @memberof RegexConverter
     */
    constructor () {
        this.interval = new RegexConverter("> (\\d+) - (\\d+) dB\\(A\\)", m => (parseFloat(m[1]) + parseFloat(m[2])) / 2);
        this.single = new RegexConverter("> (\\d+) dB\\(A\\)", m => parseFloat(m[1]));
    }

    /**
     * @param {*} str string
     * @return {*} value
     */
    convert (str) {
        const ret = this.interval.convert(str);

        if (ret === null) {
            return this.single.convert(str);
        }
        return ret;
    }
}


/**
 *
 * @param {*} name name
 * @return {*}  converter
 */
export function getConverter (name) {
    switch (name) {
        case "DbRangeConverter":
            return new DbRangeConverter();
        default:
            throw Error(`unknown converter: ${name}`);
    }
}
