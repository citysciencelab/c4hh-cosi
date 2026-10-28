/**
 * Opening hours on a one-week clock.
 *
 * Time is "minute of the week": 0 = Monday 00:00, 10079 = Sunday 23:59. The
 * data carries opening hours in a subset of the OSM opening_hours syntax
 * ("Mo-Fr 08:00-16:00; Sa 10:00-14:00"), which is what real sources such as
 * OpenStreetMap would deliver later, so the prototype parses that instead of a
 * private format.
 */

export const MINUTES_PER_DAY = 24 * 60;
export const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

const DAY_KEYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/**
 * Parses "HH:MM" into minutes after midnight.
 * @param {String} hhmm - The time.
 * @returns {Number} Minutes after midnight, NaN if malformed.
 */
function toMinutes (hhmm) {
    const match = (/^(\d{1,2}):(\d{2})$/).exec(hhmm.trim());

    return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
}

/**
 * Expands a day specification like "Mo-Fr", "Mo,We,Fr" or "Sa-Su" into day indices.
 * @param {String} spec - The day specification.
 * @returns {Number[]} Day indices, 0 = Monday.
 */
function parseDays (spec) {
    return spec.split(",").flatMap(part => {
        const [from, to] = part.trim().split("-").map(day => DAY_KEYS.indexOf(day.trim())),
            days = [];

        if (from < 0 || to === -1) {
            return [];
        }
        if (to === undefined) {
            return [from];
        }
        for (let day = from; days.length < 7; day = (day + 1) % 7) {
            days.push(day);
            if (day === to) {
                break;
            }
        }
        return days;
    });
}

/**
 * Sorts intervals and merges overlapping or touching ones.
 * @param {Array<Number[]>} intervals - [start, end] pairs.
 * @returns {Array<Number[]>} The merged intervals.
 */
function merge (intervals) {
    const sorted = [...intervals].sort((a, b) => a[0] - b[0]),
        out = [];

    sorted.forEach(([start, end]) => {
        const last = out[out.length - 1];

        if (last && start <= last[1]) {
            last[1] = Math.max(last[1], end);
        }
        else {
            out.push([start, end]);
        }
    });
    return out;
}

/**
 * Parses an opening_hours string into week-minute intervals.
 * Unknown rules are skipped rather than failing the whole value.
 * @param {String} value - e.g. "Mo-Fr 08:00-16:00; Sa 10:00-14:00".
 * @returns {Array<Number[]>} Sorted, merged [start, end] pairs in minutes of the week.
 */
export function parseOpeningHours (value) {
    if (typeof value !== "string" || value.trim() === "") {
        return [];
    }
    const intervals = [];

    value.split(";").forEach(rule => {
        const match = (/^\s*([A-Za-z,\- ]+?)\s+(\d.*)$/).exec(rule);

        if (!match) {
            return;
        }
        const days = parseDays(match[1]),
            times = match[2].split(",").map(range => range.split("-").map(toMinutes));

        days.forEach(day => {
            times.forEach(([start, end]) => {
                if (Number.isNaN(start) || Number.isNaN(end)) {
                    return;
                }
                const offset = day * MINUTES_PER_DAY,
                    // "22:00-02:00" runs past midnight into the next day
                    close = end <= start ? end + MINUTES_PER_DAY : end;

                intervals.push([offset + start, offset + close]);
            });
        });
    });
    return merge(intervals);
}

/**
 * Wraps any minute into the week [0, MINUTES_PER_WEEK).
 * @param {Number} minute - Minute, possibly outside the week.
 * @returns {Number} The wrapped minute.
 */
export function wrapMinute (minute) {
    return ((minute % MINUTES_PER_WEEK) + MINUTES_PER_WEEK) % MINUTES_PER_WEEK;
}

/**
 * Whether a facility is open at the given minute of the week.
 * @param {Array<Number[]>} intervals - Parsed opening hours.
 * @param {Number} minute - Minute of the week.
 * @returns {Boolean} True if open.
 */
export function isOpen (intervals, minute) {
    const m = wrapMinute(minute);

    // An interval running past Sunday midnight continues on Monday morning.
    return intervals.some(([start, end]) => m >= start && m < end || m + MINUTES_PER_WEEK >= start && m + MINUTES_PER_WEEK < end);
}

/**
 * Hermite smoothstep on [0, 1].
 * @param {Number} x - Input.
 * @returns {Number} Smoothed value in [0, 1].
 */
function smoothstep (x) {
    const t = Math.min(1, Math.max(0, x));

    return t * t * (3 - 2 * t);
}

/**
 * How "open" a facility looks at a minute, for animated map symbols.
 *
 * level  0 closed .. 1 open. Ramps over `ramp` minutes centred on opening and
 *        closing time, so symbols grow and shrink instead of popping.
 * glow   0 .. 1, peaks right after opening and settles to a calm level — the
 *        "lights come on" moment when a slider runs through the morning.
 *
 * @param {Array<Number[]>} intervals - Parsed opening hours.
 * @param {Number} minute - Minute of the week (fractions allowed while animating).
 * @param {Number} [ramp=30] - Ramp length in minutes.
 * @returns {{level: Number, glow: Number}} The openness.
 */
export function openness (intervals, minute, ramp = 30) {
    const m = wrapMinute(minute);
    let level = 0,
        glow = 0;

    intervals.forEach(([start, end]) => {
        [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK].forEach(shift => {
            const s = start + shift,
                e = end + shift,
                up = smoothstep((m - (s - ramp / 2)) / ramp),
                down = 1 - smoothstep((m - (e - ramp / 2)) / ramp),
                value = Math.min(up, down);

            if (value > level) {
                level = value;
                glow = value * (0.3 + 0.7 * Math.exp(-Math.max(0, m - s) / 45));
            }
        });
    });
    return {level, glow};
}

/**
 * Number of open facilities per time slot over the week.
 * @param {Array<Array<Number[]>>} intervalsList - Parsed opening hours per facility.
 * @param {Number} [step=15] - Slot length in minutes.
 * @returns {Number[]} Open count per slot, MINUTES_PER_WEEK / step entries.
 */
export function weeklyProfile (intervalsList, step = 15) {
    const slots = Math.ceil(MINUTES_PER_WEEK / step),
        counts = new Array(slots).fill(0);

    intervalsList.forEach(intervals => {
        for (let i = 0; i < slots; i++) {
            if (isOpen(intervals, i * step)) {
                counts[i]++;
            }
        }
    });
    return counts;
}

/**
 * Total opening time per week.
 * @param {Array<Number[]>} intervals - Parsed opening hours.
 * @returns {Number} Hours per week.
 */
export function hoursPerWeek (intervals) {
    return intervals.reduce((sum, [start, end]) => sum + end - start, 0) / 60;
}

/**
 * The next change of state after a minute: when an open facility closes, or a
 * closed one opens.
 * @param {Array<Number[]>} intervals - Parsed opening hours.
 * @param {Number} minute - Minute of the week.
 * @returns {{open: Boolean, at: Number}|null} Current state and the minute of the next change, null if never open.
 */
export function nextChange (intervals, minute) {
    if (intervals.length === 0) {
        return null;
    }
    const m = wrapMinute(minute),
        open = isOpen(intervals, m),
        candidates = [];

    intervals.forEach(([start, end]) => {
        [0, MINUTES_PER_WEEK].forEach(shift => {
            const edge = (open ? end : start) + shift;

            if (edge > m) {
                candidates.push(edge);
            }
        });
    });
    return {open, at: wrapMinute(Math.min(...candidates))};
}

/**
 * Splits a minute of the week into day index and "HH:MM".
 * @param {Number} minute - Minute of the week.
 * @returns {{day: Number, time: String}} Day (0 = Monday) and clock time.
 */
export function splitMinute (minute) {
    const m = Math.floor(wrapMinute(minute)),
        clock = m % MINUTES_PER_DAY;

    return {
        day: Math.floor(m / MINUTES_PER_DAY),
        time: `${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}`
    };
}
