import { CollectionReference, DocumentReference, onSnapshot, Query, Unsubscribe } from "firebase/firestore";
import { PiniaPluginContext } from "pinia";
import { ref, onScopeDispose } from 'vue'

/**
 * Adds a `sync` function to your store.
 * The `sync` method can sync your state propery with firestore  Document/Collection/Query easily. 
 * 
 * @example
 * 
 * ```ts
 * import { PiniaFirestoreSync } from 'pinia-plugin-firestore-sync'
 * ...
 * const pinia = createPinia().use(firestoreSyncPlugin)
 * app.use(pinia).mount('#app')
 * 
 * ```
 */
export const PiniaFirestoreSync = ({ store }: PiniaPluginContext) => {
  const unsub = ref<Unsubscribe>()
  store.sync = (key, ref) => {
    if (unsub.value) {
      unsub.value()
    }
    // Document
    if (ref instanceof DocumentReference) {
      unsub.value = onSnapshot(ref, (ds) => {
        if (ds.exists()) {
          const data = ds.data()
          Object.defineProperty(data, 'id', {
            value: ds.id,
            writable: false,
            enumerable: false,
          })
          store.$patch({ [key]: data })
        }
      })
    } else {
      // Collection or Query
      unsub.value = onSnapshot(ref, async (qs) => {
        const datum = qs.docs.map((d) => {
          const data = d.data()
          Object.defineProperty(data, 'id', {
            value: d.id,
            writable: false,
            enumerable: false,
          })
          return data
        })
        store.$patch((state) => {
          state[key] = datum
        })
      })
    }
    tryOnScopeDispose(unsub.value)
    return unsub.value
  }
}

declare module 'pinia' {
  // FIXME: Want to limit `key: string` to only keys of State
  export interface PiniaCustomProperties<Id, S, G, A> {
    /**
     * 
     * @param key Key name of state which synchronize with firestore document data.
     * @param ref Document reference to sync
     * 
     * @example
     * 
     * ```ts
     * type ExampleDoc = {
     *   name: string,
     *   age: number
     * }
     * 
     * export type State = {
     *   docData: ExampleDoc | null,
     * }
     * 
     * export const useExampleStore = defineStore('expamle', {
     *   state: (): State => {
     *     return {
     *       docData: null,
     *     }
     *   },
     *   actions: {
     *     async setup() {
     *       // Get Document reference
     *       const store = getFirestore()
     *       const docRef = doc(store, 'Examples/id')
     * 
     *       // Do the magic
     *       this.sync('docData', docRef)
     *     }
     *   }
     * })
     *```
     */
    sync(key: keyof S, ref: DocumentReference): Unsubscribe
    /**
     * 
     * @param key Key name of state which synchronize with firestore collection data.
     * @param ref Collection reference to sync
     * 
     * @example
     * 
     * ```ts
     * type ExampleDoc = {
     *   name: string,
     *   age: number
     * }
     * 
     * export type State = {
     *   collectionData: ExampleDoc[] | null,
     * }
     * export const useExampleStore = defineStore('expamle', {
     *   state: (): State => {
     *     return {
     *       collectionData: null,
     *     }
     *   },
     *   actions: {
     *     async setup() {
     *       // Get Collection reference
     *       const store = getFirestore()
     *       const collectionRef = collection(store, 'Examples')
     * 
     *       // Do the magic
     *       this.sync('collectionData', collectionRef)
     *     }
     *   }
     * })
     *```
     */
    sync(key: keyof S, ref: CollectionReference): Unsubscribe
    /**
     * 
     * @param key Key name of state which synchronize with firestore collection data.
     * @param ref Query to sync
     * 
     * @example
     * ```ts
     * type ExampleDoc = {
     *   name: string,
     *   age: number
     * }
     * export type State = {
     *   queryData: ExampleDoc[] | null,
     * } 
     * export const useExampleStore = defineStore('expamle', {
     *   state: (): State => {
     *     return {
     *       queryData: null,
     *     }
     *   },
     *   actions: {
     *     async setup() {
     *       // Build query
     *       const store = getFirestore()
     *       const collectionRef = collection(store, 'Examples')
     *       const q = query(collectionRef, where('name', '==', 'wombat'))
     * 
     *       // Do the magic
     *       this.sync('queryData', q)
     *     }
     *   }
     * })
     * ```
     */
    sync(key: keyof S, ref: Query): Unsubscribe
  }
}
