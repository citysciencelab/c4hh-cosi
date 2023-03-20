import dayjs from "dayjs";
import convertHttpLinkToSSL from "../../../../src/utils/convertHttpLinkToSSL";
import {getPublicHoliday} from "../../../../src/utils/calendar.js";
import isoWeek from "dayjs/plugin/isoWeek";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);

/**
 * the internal format for Gurlitt time is called GurlittMoment
 * @typedef {Object} GurlittMoment
 * @property {Number} result the result/value of this dayjs as number
 * @property {dayjs} momentStart the dayjs representation of the start time (dayjs object)
 * @property {dayjs} momentEnd the dayjs representation of the end time (dayjs object)
 */

/**
 * DauerzaehlstellenRadApi is the api for the TrafficCount GFI Theme with Gurlitt data source
 * <pre>
 * The DauerzaehlstellenRadApi uses the given feature to mock the TrafficCountApi to use the TrafficCount GFI Theme for Gurlitt
 * </pre>
 * @class
 * @memberof Tools.GFI.Themes.TrafficCount
 */
export class DauerzaehlstellenRadApi {

    /**
     * constructor of DauerzaehlstellenRadApi
     * @param {Object} feature the feature to use
     * @param {Function} [onerror] the fucntion to call in case of an error
     * @param {Function} [callLinkDownload] the function to call the csv file with
     * @constructor
     * @returns {void}
     */
    constructor (feature, onerror, callLinkDownload) {
        const link_download = feature.getProperties().link_download,
            link_download_ssl = convertHttpLinkToSSL(link_download);

        this.waitingListForCallLinkDownload = [];

        this.feature = feature;
        this.offsetOfCsvDataYear = -88000;
        this.offsetOfCsvDataWeek = -17600;
        this.offsetOfCsvDataDay = -360;
        this.gurlittMomentsYear = [];
        this.gurlittMomentsWeek = [];
        this.gurlittMomentsDay = [];

        if (this.featureExists() && typeof callLinkDownload === "function") {
            callLinkDownload(link_download_ssl, data => {
                const gurlittCsvData = this.parseCSVData(data, ";");

                this.gurlittMomentsDay = this.createGurlittMomentDataDay(gurlittCsvData);
                this.gurlittMomentsWeek = this.createGurlittMomentDataWeek(gurlittCsvData);
                this.gurlittMomentsYear = this.createGurlittMomentDataYear(gurlittCsvData);

                while (this.waitingListForCallLinkDownload.length) {
                    const handler = this.waitingListForCallLinkDownload.shift();

                    if (typeof handler === "function") {
                        handler();
                    }
                }
            }, error => {
                console.warn("error", error);
            });
        }
        else if (typeof onerror === "function") {
            onerror("DauerzaehlstellenRadApi.constructor: the feature to use has an unexpected structure or the callLinkDownload function is missing", this.feature);
        }
    }

    /**
     * checks if this.feature is save to use
     * @returns {Boolean} true if this.feature is save to use, false if not
     */
    featureExists () {
        return typeof this.feature === "object" && this.feature !== null
            && typeof this.feature.getProperties === "function"
            && typeof this.feature.getId === "function";
    }

    /**
     * returns the id to use outside for referencing any function of DauerzaehlstellenRadApi
     * @param {Function} [onerror] the fucntion to call in case of an error
     * @returns {String|Boolean} the id to use or false if no feature is available (in which case onerror is called too)
     */
    getThingId (onerror) {
        if (this.featureExists()) {
            return this.feature.getId();
        }
        else if (typeof onerror === "function") {
            onerror("DauerzaehlstellenRadApi.getThingId: the feature to use has an unexpected structure", this.feature);
        }
        return false;
    }

    /**
     * returns the means of transport to use for all functions outside DauerzaehlstellenRadApi
     * you should give meansOfTransport in any function of DauerzaehlstellenRadApi to get results
     * @returns {String} the meansOfTransport
     */
    getMeansOfTransport () {
        return "Anzahl_Fahrraeder";
    }

    /**
     * gets the title of the thing
     * @param {Integer} thingId the ID of the thing
     * @param {Function} [onupdate] as function(title) to set the title with
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    updateTitle (thingId, onupdate, onerror, onstart, oncomplete) {
        if (typeof onstart === "function") {
            onstart();
        }

        if (!this.featureExists()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateTitle: the feature to use has an unexpected structure", this.feature);
            }
        }
        else if (thingId === this.getThingId()) {
            onupdate(this.feature.getProperties().name);
        }
        else if (typeof onerror === "function") {
            onerror("DauerzaehlstellenRadApi.updateTitle: the given thingId is not the one received by the api via api.getThingId()", thingId);
        }

        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }

    /**
     * gets the direction of the thing
     * @param {Integer} thingId the ID of the thing
     * @param {Function} [onupdate] as function(direction) to set the direction
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    updateDirection (thingId, onupdate, onerror, onstart, oncomplete) {
        if (typeof onstart === "function") {
            onstart();
        }

        if (thingId === this.getThingId()) {
            onupdate(i18next.t("additional:modules.tools.gfi.themes.trafficCount.directionBoth"));
        }
        else if (typeof onerror === "function") {
            onerror("DauerzaehlstellenRadApi.updateDirection: the given thingId is not the one received by the api via api.getThingId()", thingId);
        }

        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }

    /**
     * gets the sum for a single day - in this case gets always the data for the last day
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} day the day as String in format YYYY-MM-DD
     * @param {Function} [onupdate] as event function(date, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    updateDay (thingId, meansOfTransport, day, onupdate, onerror, onstart, oncomplete) {
        if (typeof onstart === "function") {
            onstart();
        }

        if (!this.featureExists()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateDay: the feature to use has an unexpected structure", this.feature);
            }
        }
        else if (thingId !== this.getThingId()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateDay: the given thingId is not the one received by the api via api.getThingId()", thingId);
            }
        }
        else if (typeof this.feature.getProperties().radfahrende_vortag !== "string") {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateDay: the feature property radfahrende_vortag is missing or was ill received", this.feature.getProperties().radfahrende_vortag);
            }
        }
        else {
            // e.g. "18.07.2021|6310"
            const parts = this.feature.getProperties().radfahrende_vortag.split("|");

            onupdate(dayjs(parts[0], "DD.MM.YYYY").format("YYYY-MM-DD"), parseInt(parts[1], 10));
        }

        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }

    /**
     * gets the sum of a year - in this case gets the current year or the last year
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} year the year as String in format YYYY
     * @param {Function} onupdate as event function(year, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {String} [yearTodayOpt=NOW] as a String marking todays year in format YYYY; if left false, todays year is set automatically
     * @returns {void}
     */
    updateYear (thingId, meansOfTransport, year, onupdate, onerror, onstart, oncomplete, yearTodayOpt) {
        const todaysYear = yearTodayOpt || dayjs().format("YYYY");

        if (typeof onstart === "function") {
            onstart();
        }

        if (!this.featureExists()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateYear: the feature to use has an unexpected structure", this.feature);
            }
        }
        else if (thingId !== this.getThingId()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateYear: the given thingId is not the one received by the api via api.getThingId()", thingId);
            }
        }
        else if (typeof this.feature.getProperties().radfahrende_vorjahr !== "string") {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateYear: the feature property radfahrende_vorjahr is missing or was ill received", this.feature.getProperties().radfahrende_vorjahr);
            }
        }
        else if (typeof this.feature.getProperties().radfahrende_seit_jahresbeginn !== "string") {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateYear: the feature property radfahrende_seit_jahresbeginn is missing or was ill received", this.feature.getProperties().radfahrende_seit_jahresbeginn);
            }
        }
        else if (year === todaysYear) {
            // e.g. "01.01.2021|1069093"
            const parts = this.feature.getProperties().radfahrende_seit_jahresbeginn.split("|");

            onupdate(dayjs(parts[0], "DD.MM.YYYY").format("YYYY"), parseInt(parts[1], 10));
        }
        else {
            // e.g. "2020|2367656"
            const parts = this.feature.getProperties().radfahrende_vorjahr.split("|");

            onupdate(parts[0], parseInt(parts[1], 10));
        }

        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }

    /**
     * gets the total sum
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {Function} onupdate as event function(firstDate, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    updateTotal (thingId, meansOfTransport, onupdate, onerror, onstart, oncomplete) {
        if (typeof onstart === "function") {
            onstart();
        }

        if (!this.featureExists()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateTotal: the feature to use has an unexpected structure", this.feature);
            }
        }
        else if (thingId !== this.getThingId()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateTotal: the given thingId is not the one received by the api via api.getThingId()", thingId);
            }
        }
        else if (typeof this.feature.getProperties().radfahrende_insgesamt !== "string") {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateTotal: the feature property radfahrende_insgesamt is missing or was ill received", this.feature.getProperties().radfahrende_insgesamt);
            }
        }
        else {
            // e.g. "08.10.2014|14636033"
            const parts = this.feature.getProperties().radfahrende_insgesamt.split("|");

            onupdate(dayjs(parts[0], "DD.MM.YYYY").format("YYYY-MM-DD"), parseInt(parts[1], 10));
        }

        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }
    /**
     * gets the average of working days, excludes saturday, sunday and the given holidays
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} days the days from now to load the average from
     * @param {Object[]} holidays the holidays to exclude from the calculation
     * @param {Function} onupdate as event function(date, value)
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    updateWorkingDayAverage (thingId, meansOfTransport, days, holidays, onupdate, onerror, onstart, oncomplete) {
        if (!this.gurlittMomentsYear.length && !this.gurlittMomentsWeek.length && !this.gurlittMomentsDay.length) {
            this.waitingListForCallLinkDownload.push(() => {
                this.updateWorkingDayAverage(thingId, meansOfTransport, days, holidays, onupdate, onerror, onstart, oncomplete);
            });
            return;
        }

        const gurlittMoments = this.gurlittMomentsWeek.slice(Math.abs(days) * -1);
        let value = 0,
            workDayCount = 0,
            firstMoment = null;

        if (typeof onstart === "function") {
            onstart();
        }
        gurlittMoments.forEach(gurlittMoment => {
            if (typeof gurlittMoment !== "object" || gurlittMoment === null || !(gurlittMoment.momentStart instanceof dayjs)) {
                return;
            }
            const holiday = getPublicHoliday(gurlittMoment.momentStart, holidays),
                dayOfWeek = gurlittMoment.momentStart.isoWeekday();

            if (firstMoment === null) {
                firstMoment = gurlittMoment.momentStart;
            }
            if (holiday || dayOfWeek === 6 || dayOfWeek === 7) {
                return;
            }

            value += typeof gurlittMoment?.result === "number" ? gurlittMoment.result : 0;
            workDayCount++;
        });

        if (typeof onupdate === "function") {
            onupdate(firstMoment ? firstMoment.format("YYYY-MM-DD") : "", workDayCount !== 0 ? Math.round(value / workDayCount) : 0);
        }
        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }

    /**
     * gets the strongest day in the given year excluding today
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} year the year as String in format YYYY
     * @param {Function} onupdate as event function(date, value)
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    updateHighestWorkloadDay (thingId, meansOfTransport, year, onupdate, onerror, onstart, oncomplete) {
        if (typeof onstart === "function") {
            onstart();
        }

        if (!this.featureExists()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateHighestWorkloadDay: the feature to use has an unexpected structure", this.feature);
            }
        }
        else if (thingId !== this.getThingId()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateHighestWorkloadDay: the given thingId is not the one received by the api via api.getThingId()", thingId);
            }
        }
        else if (typeof this.feature.getProperties().max_radfahrende_tag_jahr !== "string") {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateHighestWorkloadDay: the feature property max_radfahrende_tag_jahr is missing or was ill received", this.feature.getProperties().max_radfahrende_tag_jahr);
            }
        }
        else {
            // e.g. "09.06.2021|12225"
            const parts = this.feature.getProperties().max_radfahrende_tag_jahr.split("|");

            onupdate(dayjs(parts[0], "DD.MM.YYYY").format("YYYY-MM-DD"), parseInt(parts[1], 10));
        }

        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }

    /**
     * gets the strongest week in the given year excluding the current week
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} year the year as String in format YYYY
     * @param {Function} onupdate as event function(calendarWeek, value)
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    updateHighestWorkloadWeek (thingId, meansOfTransport, year, onupdate, onerror, onstart, oncomplete) {
        if (typeof onstart === "function") {
            onstart();
        }

        if (!this.featureExists()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateHighestWorkloadWeek: the feature to use has an unexpected structure", this.feature);
            }
        }
        else if (thingId !== this.getThingId()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateHighestWorkloadWeek: the given thingId is not the one received by the api via api.getThingId()", thingId);
            }
        }
        else if (typeof this.feature.getProperties().max_radfahrende_woche_jahr !== "string") {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateHighestWorkloadWeek: the feature property max_radfahrende_woche_jahr is missing or was ill received", this.feature.getProperties().max_radfahrende_woche_jahr);
            }
        }
        else {
            // e.g. "22|67640"
            const parts = this.feature.getProperties().max_radfahrende_woche_jahr.split("|");

            onupdate(parts[0], parseInt(parts[1], 10));
        }

        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }

    /**
     * gets the strongest month in the given year including the current month
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} year the year as String in format YYYY
     * @param {Function} onupdate as event function(month, value)
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    updateHighestWorkloadMonth (thingId, meansOfTransport, year, onupdate, onerror, onstart, oncomplete) {
        if (typeof onstart === "function") {
            onstart();
        }

        if (!this.featureExists()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateHighestWorkloadMonth: the feature to use has an unexpected structure", this.feature);
            }
        }
        else if (thingId !== this.getThingId()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateHighestWorkloadMonth: the given thingId is not the one received by the api via api.getThingId()", thingId);
            }
        }
        else if (typeof this.feature.getProperties().max_radfahrende_monat_jahr !== "string") {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateHighestWorkloadMonth: the feature property max_radfahrende_monat_jahr is missing or was ill received", this.feature.getProperties().max_radfahrende_monat_jahr);
            }
        }
        else {
            // e.g. "06|269544"
            const parts = this.feature.getProperties().max_radfahrende_monat_jahr.split("|");

            onupdate(parts[0], parseInt(parts[1], 10));
        }

        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }

    /**
     * gets the data for a diagram or table for the given interval
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} timeSettings configuration
     * @param {String} timeSettings.interval the interval to call as '15-Min', '1-Stunde' or '1-Woche'
     * @param {String} timeSettings.from the day to start from (inclusive) as String in format YYYY-MM-DD
     * @param {String} timeSettings.until the day to end with (inclusive) as String in format YYYY-MM-DD
     * @param {Function} onupdate as event function(data) fires initialy and anytime server site changes are made; with data as object {meansOfTransport: {date: value}}
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    updateDataset (thingId, meansOfTransport, timeSettings, onupdate, onerror, onstart, oncomplete) {
        const result = [],
            timeSettingsList = Array.isArray(timeSettings) ? timeSettings : [timeSettings];

        if (!this.gurlittMomentsYear.length && !this.gurlittMomentsWeek.length && !this.gurlittMomentsDay.length) {
            this.waitingListForCallLinkDownload.push(() => {
                this.updateDataset(thingId, meansOfTransport, timeSettings, onupdate, onerror, onstart, oncomplete);
            });
            return;
        }

        if (typeof onstart === "function") {
            onstart();
        }

        if (thingId !== this.getThingId()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.updateDataset: the given thingId is not the one received by the api via api.getThingId()", thingId);
            }
        }
        else {
            timeSettingsList.forEach(timeSet => {
                const subresult = {};

                subresult[meansOfTransport] = {};

                if (typeof timeSet !== "object" || timeSet === null || typeof timeSet.interval !== "string" || typeof timeSet.from !== "string" || typeof timeSet.until !== "string") {
                    if (typeof onerror === "function") {
                        onerror("DauerzaehlstellenRadApi.updateDataset: the given timeSettings contain a timeSet with an unexpected format", timeSettings);
                    }
                }
                else if (timeSet.interval === "15-Min") {
                    // call for day
                    this.gurlittMomentsDay.forEach(gurlittMoment => {
                        if (gurlittMoment.momentStart.format("YYYY-MM-DD") === timeSet.from) {
                            subresult[meansOfTransport][gurlittMoment.momentStart.format("YYYY-MM-DD HH:mm:ss")] = gurlittMoment.result;
                        }
                    });
                }
                else if (timeSet.interval === "1-Tag") {
                    // call for week
                    this.gurlittMomentsWeek.forEach(gurlittMoment => {
                        if (dayjs(gurlittMoment.momentStart).startOf("isoWeek").format("YYYY-MM-DD") === timeSet.from) {
                            subresult[meansOfTransport][gurlittMoment.momentStart.format("YYYY-MM-DD HH:mm:ss")] = gurlittMoment.result;
                        }
                    });
                }
                else if (timeSet.interval === "1-Woche") {
                    // call for year
                    this.gurlittMomentsYear.forEach(gurlittMoment => {
                        // subtract 3 days to savely include the first thursday of january into the interval, as the first calendar week always includes the first thursday of january
                        if (dayjs(gurlittMoment.momentStart).startOf("year").subtract(3, "day").format("YYYY-MM-DD") === timeSet.from) {
                            subresult[meansOfTransport][gurlittMoment.momentStart.format("YYYY-MM-DD HH:mm:ss")] = gurlittMoment.result;
                        }
                        else if (dayjs(gurlittMoment.momentEnd).format("YYYY-MM-DD") === timeSet.until) {
                            subresult[meansOfTransport][gurlittMoment.momentStart.format("YYYY-MM-DD HH:mm:ss")] = gurlittMoment.result;
                        }
                    });
                }
                else if (typeof onerror === "function") {
                    onerror("DauerzaehlstellenRadApi.updateDataset: unexpected interval", timeSet);
                }

                result.push(subresult);
            });
            onupdate(result);
        }

        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }

    /**
     * "subscribes the last change of data" - in this case returns the last value of tageslinie as date of last change
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {Function} [onupdate] as event function(phenomenonTime) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    subscribeLastUpdate (thingId, meansOfTransport, onupdate, onerror, onstart, oncomplete) {
        if (!this.gurlittMomentsYear.length && !this.gurlittMomentsWeek.length && !this.gurlittMomentsDay.length) {
            this.waitingListForCallLinkDownload.push(() => {
                this.subscribeLastUpdate(thingId, meansOfTransport, onupdate, onerror, onstart, oncomplete);
            });
            return;
        }

        if (typeof onstart === "function") {
            onstart();
        }

        if (thingId !== this.getThingId()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.subscribeLastUpdate: the given thingId is not the one received by the api via api.getThingId()", thingId);
            }
        }
        else if (!Array.isArray(this.gurlittMomentsDay) || this.gurlittMomentsDay.length === 0) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.subscribeLastUpdate: there is no data for day data to base the last update on", this.gurlittMomentsDay);
            }
        }
        else {
            const lastGurlittMomentDay = this.gurlittMomentsDay[this.gurlittMomentsDay.length - 1];

            onupdate(dayjs(lastGurlittMomentDay.momentEnd).format("YYYY-MM-DDTHH:mm:ss.000Z"));
        }

        if (typeof oncomplete === "function") {
            oncomplete();
        }
    }

    /**
     * unsubscribe all subscriptions that have been made so far by any function of this api
     * @param {Function} [onsuccess] an event function() to fire when all subscriptions have been successfully canceled
     * @returns {void}
     */
    unsubscribeEverything (onsuccess) {
        if (typeof onsuccess === "function") {
            onsuccess();
        }
    }

    /**
     * gets the title and the data without subscription for the given thingId, meansOfTransport and timeSettings
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} timeSettings time configuration
     * @param {String} timeSettings.interval the interval to call as '15-Min', '1-Stunde' or '1-Woche'
     * @param {String} timeSettings.from the day to start from (inclusive) as String in format YYYY-MM-DD
     * @param {String} timeSettings.until the day to end with (inclusive) as String in format YYYY-MM-DD
     * @param {Function} onsuccess as event function(result) with result{title, dataset} and dataset{meansOfTransport: {date: value}}; fired once on success (no subscription)
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    downloadData (thingId, meansOfTransport, timeSettings, onsuccess, onerror, onstart, oncomplete) {
        if (typeof onstart === "function") {
            onstart();
        }
        if (thingId !== this.getThingId()) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.downloadData: the given thingId is not the one received by the api via api.getThingId()", thingId);
            }
            if (typeof oncomplete === "function") {
                oncomplete();
            }
            return;
        }
        else if (typeof timeSettings !== "object" || timeSettings === null || typeof timeSettings.interval !== "string") {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.downloadData: the given timeSettings contain a timeSet with an unexpected format", timeSettings);
            }
            if (typeof oncomplete === "function") {
                oncomplete();
            }
            return;
        }

        this.updateTitle(thingId, title => {
            const data = {};

            data[meansOfTransport] = {};

            if (timeSettings.interval === "15-Min") {
                // call for day
                this.gurlittMomentsDay.forEach(gurlittMoment => {
                    data[meansOfTransport][gurlittMoment.momentStart.format("YYYY-MM-DD HH:mm:ss")] = gurlittMoment.result;
                });
            }
            else if (timeSettings.interval === "1-Tag") {
                // call for week
                this.gurlittMomentsWeek.forEach(gurlittMoment => {
                    data[meansOfTransport][gurlittMoment.momentStart.format("YYYY-MM-DD HH:mm:ss")] = gurlittMoment.result;
                });
            }
            else if (timeSettings.interval === "1-Woche") {
                // call for year
                this.gurlittMomentsYear.forEach(gurlittMoment => {
                    data[meansOfTransport][gurlittMoment.momentStart.format("YYYY-MM-DD HH:mm:ss")] = gurlittMoment.result;
                });
            }
            else {
                if (typeof onerror === "function") {
                    onerror("DauerzaehlstellenRadApi.updateDataset: unexpected interval", timeSettings);
                }
                if (typeof oncomplete === "function") {
                    oncomplete();
                }
                return;
            }

            if (typeof onsuccess === "function") {
                onsuccess({
                    title,
                    data
                });
            }
            if (typeof oncomplete === "function") {
                oncomplete();
            }
        }, onerror);
    }

    /**
     * gets the first date ever
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {Function} onsuccess as event function(firstDate) fires once
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {void}
     */
    getFirstDateEver (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
        if (!this.gurlittMomentsYear.length && !this.gurlittMomentsWeek.length && !this.gurlittMomentsDay.length) {
            this.waitingListForCallLinkDownload.push(() => {
                this.getFirstDateEver(thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete);
            });
            return;
        }

        if (
            !Array.isArray(this.gurlittMomentsYear) || !this.gurlittMomentsYear.length
            || !(this.gurlittMomentsYear[0].momentStart instanceof dayjs)
        ) {
            if (typeof onerror === "function") {
                onerror("DauerzaehlstellenRadApi.getFirstDateEver: no first date found in gurlittMomentsYear", this.gurlittMomentsYear);
            }
        }
        else if (typeof onsuccess === "function") {
            onsuccess(this.gurlittMomentsYear[0].momentStart.format("YYYY-MM-DDTHH:mm:ss.SSSZ"));
        }
    }

    /* private */


    /**
     * parse the given csv data
     * @param {String} data the csv string which should be parsed
     * @param {String} [delim=";"] the delimitor for csv cells
     * @param {Number} [ignoreRows=2] rows to ignore at the top of the file
     * @returns {Array[]} returns a two dimensional array which represents the csv data
     */
    parseCSVData (data, delim = ";", ignoreRows = 2) {
        if (typeof data !== "string") {
            return false;
        }
        const lines = data.replace(/\r/g, "").split("\n"),
            result = [];

        lines.forEach((line, rowNr) => {
            if (rowNr < ignoreRows) {
                return;
            }
            const lineValues = line.split(delim);

            result.push(lineValues);
        });
        return result;
    }

    /**
     * creates the data for the day with the given parsed csv data
     * @param {Array[]} parsedCsvData the csv data as two dimensional array
     * @returns {GurlittMoment[]|Boolean} the results as array of GurlittMomment or false on error
     */
    createGurlittMomentDataDay (parsedCsvData) {
        if (!Array.isArray(parsedCsvData)) {
            return false;
        }
        const gurlittMoments = [];

        parsedCsvData.slice(this.offsetOfCsvDataDay).forEach(line => {
            if (!Array.isArray(line) || line.length < 3) {
                return;
            }
            const date = line[0],
                time = line[1].substr(0, 5),
                datetime = date + time,
                momentStart = dayjs(datetime, "DD.MM.YYYYHH:mm");

            gurlittMoments.push({
                result: parseInt(line[2], 10),
                momentStart,
                momentEnd: dayjs(momentStart).add(1, "hour")
            });
        });

        return gurlittMoments;
    }

    /**
     * creates the data for the week with the given parsed csv data
     * @param {Array[]} parsedCsvData the csv data as two dimensional array
     * @returns {GurlittMoment[]|Boolean} the results as array of GurlittMomment or false on error
     */
    createGurlittMomentDataWeek (parsedCsvData) {
        if (!Array.isArray(parsedCsvData)) {
            return false;
        }
        const gurlittMoments = [],
            slicedCsvData = parsedCsvData.slice(this.offsetOfCsvDataWeek);
        let result = 0;

        slicedCsvData.forEach((line, idx) => {
            if (!Array.isArray(line) || line.length < 3) {
                return;
            }
            const nextLine = slicedCsvData[idx + 1],
                dayOfNextLine = nextLine ? nextLine[0] : false,
                currentDay = line[0];

            result += parseInt(line[2], 10);

            if (currentDay !== dayOfNextLine) {
                const momentStart = dayjs(currentDay + "00:00", "DD.MM.YYYYHH:mm");

                gurlittMoments.push({
                    result,
                    momentStart,
                    momentEnd: dayjs(momentStart).add(1, "day")
                });
                result = 0;
            }
        });

        return gurlittMoments;
    }

    /**
     * creates the data of the year with the given parsed csv data
     * @param {Array[]} parsedCsvData the csv data as two dimensional array
     * @returns {GurlittMoment[]|Boolean} the results as array of GurlittMomment or false on error
     */
    createGurlittMomentDataYear (parsedCsvData) {
        if (!Array.isArray(parsedCsvData)) {
            return false;
        }
        const gurlittMoments = [],
            daysAssoc = {};
        let result = 0,
            currentCalendarWeek = false,
            calendarWeekOfNextDay = false,
            daysAssocEntries = [];

        parsedCsvData.slice(this.offsetOfCsvDataYear).forEach(line => {
            if (!Array.isArray(line) || line.length < 3) {
                return;
            }
            const key = line[0];

            if (!Object.prototype.hasOwnProperty.call(daysAssoc, key)) {
                daysAssoc[key] = 0;
            }
            daysAssoc[key] += parseInt(line[2], 10);
        });

        daysAssocEntries = Object.entries(daysAssoc);
        daysAssocEntries.forEach((dataset, idx) => {
            const currentDay = dataset[0],
                value = dataset[1],
                nextLine = daysAssocEntries[idx + 1],
                nextDay = Array.isArray(nextLine) ? nextLine[0] : false;

            if (currentCalendarWeek === false) {
                currentCalendarWeek = dayjs(currentDay, "DD.MM.YYYY").format("WW");
            }
            else {
                currentCalendarWeek = calendarWeekOfNextDay;
            }
            calendarWeekOfNextDay = nextDay ? dayjs(nextDay, "DD.MM.YYYY").format("WW") : false;

            result += parseInt(value, 10);

            if (currentCalendarWeek !== calendarWeekOfNextDay) {
                const momentStart = dayjs(currentDay, "DD.MM.YYYY").startOf("isoWeek");

                gurlittMoments.push({
                    result,
                    momentStart,
                    momentEnd: dayjs(momentStart).endOf("isoWeek")
                });
                result = 0;
            }
        });

        return gurlittMoments;
    }
}
