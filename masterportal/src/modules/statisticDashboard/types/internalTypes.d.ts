export interface ReferenceData {
    date: {title: string, value: string}[];
    region: string[];
}

import type { StatisticsAttribute } from "./typesStatisticDashboard";

export type SelectedStatistics = Record<
    string,
    StatisticsAttribute & {key: string, selectedOrder: number}
>

/** A tag of an aggregated statistic, as shown in the specifics selection. The tag is translated in the component. */
export interface SpecificsTag {
    value: string;
    active: boolean;
    /** Number of defined specific statistics configured for this tag. */
    availableCount: number;
    /** The selected specific statistics of this tag, in configured order. Empty if the tag is not active. */
    selectedSpecifics: {value: string, title: string}[];
}

/** The specifics selection of one selected aggregated statistic. */
export interface SpecificsSelection {
    /** Key of the aggregated statistic. */
    key: string;
    /** Display name of the aggregated statistic. */
    name: string;
    tags: SpecificsTag[];
}

/** A tag of an attribute's specifics together with the statistic keys it references. */
export type SpecificsEntry = [tag: string, keys: string[]];
