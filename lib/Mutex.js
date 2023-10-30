'use strict';

export class Mutex {
    constructor() {
        this._lock = Promise.resolve();   
    }
    _acquire() {
        let release;
        this._lock = new Promise(resolve => {
            release = resolve;
        })
        return release;
    }
    acquireQueued() {
        const q = this._lock.then(() => release);
        const release = this._acquire();
        return q;
    }
}

const sleep = delay => new Promise((resolve) => setTimeout(resolve, delay));