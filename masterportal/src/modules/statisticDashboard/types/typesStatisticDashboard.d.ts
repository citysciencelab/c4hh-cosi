/** Additional query parameters for the OAF geometry request. */
export interface GeomRequestParams {
    /** Reference date for the geometries, e.g. "2022-12-31". */
    datetime?: string;
    limit?: number;
}

/** Selectable time steps, keyed by number of years (or "all"), value is the label. */
export interface TimeStepsFilter {
    [years: string]: string;
}

export interface TimeAttribute {
    attrName: string;
    name: string;
    /** dayjs format of the incoming date, e.g. "YYYY-MM-DD". */
    inputFormat: string;
    /** dayjs format used for display, e.g. "YYYY". */
    outputFormat: string;
}

/** Region hierarchy level; nested via `child` for finer levels. */
export interface RegionNameAttribute {
    attrName: string[];
    name: string;
    child?: RegionNameAttribute;
}

/** Hidden from the normal list if listed in the `specifics` of another attribute. */
export interface StatisticsAttribute {
    name: string;
    category: string;
    /** Tag to keys of the more specific statistics shown while this attribute is selected and the tag is set. */
    specifics?: Record<string, string[]>;
}

export interface MappingFilter {
    timeAttribute: TimeAttribute;
    regionNameAttribute: RegionNameAttribute;
    /** Statistics keyed by their attribute name in the data source. */
    statisticsAttributes: Record<string, StatisticsAttribute>;
}

/** One configured level (e.g. "Kreise", "Gemeinden") of the statistic dashboard. */
export interface StatisticDashboardLevel {
    layerId: string[];
    levelName: string;
    levelTitle?: string;
    geometryAttribute: string[];
    oafRequestCRS: string;
    oafDataProjectionCode: string;
    geomRequestParams?: GeomRequestParams;
    timeStepsFilter?: TimeStepsFilter;
    mappingFilter: MappingFilter;
}
