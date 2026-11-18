/** Item as consumed by Vuetify's v-autocomplete / v-select. */
export interface DropdownItem<T = unknown> {
    title: string;
    value: T;
    /** Keeps the item in front of the other items, if the dropdown is sortable. */
    pinned?: boolean;
    /** Extra props forwarded by Vuetify to the list item, e.g. disabled. */
    props?: Record<string, unknown>;
}
