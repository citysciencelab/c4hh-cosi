export type SimpleGetters<State extends Record<string, any>>
    = {[Key in keyof State]: (state: State) => State[Key]}

export type SimpleMutations<State extends Record<string, any>>
    = {[Key in keyof State & string as `set${Capitalize<Key>}`]: (state: State, payload: State[Key]) => void}
