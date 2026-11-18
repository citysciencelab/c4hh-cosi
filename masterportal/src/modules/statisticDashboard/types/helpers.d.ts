import getters from "../store/gettersStatisticDashboard.js";
import mutations from "../store/mutationsStatisticDashboard.js";

type GetterMap = Record<string, (...args: any) => any>;
type MutationMap = Record<string, (state: any, ...payload: any) => void>;

type MutationMethod<Mutation extends MutationMap[string]>
    = Mutation extends (state: any, ...payload: infer Payload) => any
        ? (...payload: Payload) => void
        : never;

export interface TypedMapGetters<Getters extends GetterMap> {
    <Key extends keyof Getters & string>(namespace: string, keys: Key[])
        : {[K in Key]: () => ReturnType<Getters[K]>};
    <Map extends Record<string, keyof Getters & string>>(namespace: string, map: Map)
        : {[K in keyof Map]: () => ReturnType<Getters[Map[K]]>};
}

export interface TypedMapMutations<Mutations extends MutationMap> {
    <Key extends keyof Mutations & string>(namespace: string, keys: Key[])
        : {[K in Key]: MutationMethod<Mutations[K]>};
    <Map extends Record<string, keyof Mutations & string>>(namespace: string, map: Map)
        : {[K in keyof Map]: MutationMethod<Mutations[Map[K]]>};
}

export type StatisticDashboardMapGetters = TypedMapGetters<typeof getters>;
export type StatisticDashboardMapMutations = TypedMapMutations<typeof mutations>;