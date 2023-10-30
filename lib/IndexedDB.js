'use strict';

export class IndexedDB {
    constructor(name, version) {
        this.IDB_NAME = name;
        this.db = this.open(version);   
    }
    init(name, version) {
        this.IDB_NAME = name;
        this.db = this.open(version);   
    }
    open(IDB_VERSION = 1) {
        return new Promise((resolve, reject) => {
            if(!('indexedDB' in window)) {
                reject('This browser doesn\'t support IndexedDB');
                return;
            }
            
            const IDBOpenDBRequest = indexedDB.open(this.IDB_NAME, IDB_VERSION);
            
            IDBOpenDBRequest.onsuccess = (event) => {
                // console.warn('IndexedDB open success event : ', event);
                resolve(IDBOpenDBRequest.result);
            };

            IDBOpenDBRequest.onerror = (event) => {
                console.warn('IndexedDB open error event : ', event);
                reject(IDBOpenDBRequest.error);
            };
            
            IDBOpenDBRequest.onupgradeneeded = (event) => {
                console.warn('IndexedDB open onupgradeneeded event : ', event);
                const idb = IDBOpenDBRequest.result;
                if(!idb.objectStoreNames.contains(this.IDB_NAME)) {
                    const objectStore = idb.createObjectStore(this.IDB_NAME);
                    objectStore.transaction.oncomplete = (event) => {
                        console.warn('Transaction complete event : ', event);
                    };
                }
            };

            IDBOpenDBRequest.onblocked = (event) => {
                console.warn('IndexedDB open onblocked event : ', event);
            };

            IDBOpenDBRequest.onversionchange = (event) => {
                console.warn('IndexedDB open onversionchange event : ', event);
            };
        });
    }
    get(key) {
        return new Promise((resolve, reject) => {
            this.db && this.db.then(idb => {
                const transaction = idb.transaction(this.IDB_NAME, 'readonly');
                const store = transaction.objectStore(this.IDB_NAME);
                const getRequest = store.get(key);
                getRequest.onsuccess = (e) => {
                    this.dispatch('get');
                    resolve(e.target.result)
                };
                getRequest.onerror = (e) => reject(e.target.error);
            });
        });
    }
    set(key, item) {
        return new Promise((resolve, reject) => {
            this.db && this.db.then(idb => {
                const transaction = idb.transaction(this.IDB_NAME, 'readwrite');
                const store = transaction.objectStore(this.IDB_NAME);
                const setRequest = store.put(item, key);
                setRequest.onsuccess = (e) => {
                    this.dispatch('set');
                    resolve(e.target.result)
                };
                setRequest.onerror = (e) => reject(e.target.error);
            });
        });
    }
    remove(key) {
        return new Promise((resolve, reject) => {
            this.db && this.db.then(idb => {
                const transaction = idb.transaction(this.IDB_NAME, 'readwrite');
                const store = transaction.objectStore(this.IDB_NAME);
                const deleteRequest = store.delete(key);
                deleteRequest.onsuccess = (e) => {
                    this.dispatch('remove');
                    resolve(e.target.result)
                };
                deleteRequest.onerror = (e) => reject(e.target.error);
            });
        });
    }
    dispatch(key) {
        chrome.runtime.sendMessage({
            type: 'IDB_EVENT',
            event: key
        });
    }
}