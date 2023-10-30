'use strict';
/*
 * disable cache
 * only IndexedDB.set in offscreen.js
 * https://httpstat.us/Random/200,201,500-504
 */

import {IndexedDB} from '/lib/IndexedDB.js';
import {Mutex} from '/lib/Mutex.js';
import {sleep, priority} from '/lib/Util.js';
import {__HD__resource} from './js/__HD__resource.js';
import {__HD__regex} from './js/__HD__regex.js';
import {__HD__page} from './js/__HD__page.js';

self.requestMutex = new Mutex();
self.initiatorCache = new Map();

let testObj = {
    1234: {
        name: '국방부',
        url: 'https://www.mnd.go.kr',
        initiator: 'https://www.mnd.go.kr',
        ip: '', //
        regx: ['test', 'abc', 'https://localhost/123'],
        state: priority.normal,
        mainframeCode: 204
    },
    1235: {
        name: '국방홍보원',
        url: 'https://kookbang.dema.mil.kr',
        initiator: 'https://kookbang.dema.mil.kr',
        ip: '125.61.29.210',
        regx: ['test', 'abc', 'https://localhost/123'],
        state: priority.normal,
        mainframeCode: 204
    },
};

/*
for(let i = 2; i < 100; i++) {
    testObj[i] = {
        name: '국방부',
        url: 'https://www.mnd.go.kr'
    }
}
*/


(async () => {
    self.IDB = new IndexedDB('Defacement', 1);
    await self.IDB.set('PAGE_LIST', testObj);
    await self.IDB.set('https://kookbang.dema.mil.kr', new Map());
    await self.IDB.set('https://www.mnd.go.kr', new Map());

    self.initiatorCache.set('https://kookbang.dema.mil.kr', {
        key: 1235,
        regx: [new RegExp('test'), new RegExp('abc'), RegExp('https://localhost/123')]
    });
    self.initiatorCache.set('https://www.mnd.go.kr', {
        key: 1234,
        regx: [new RegExp('test'), new RegExp('abc'), RegExp('https://localhost/123')]
    });

    self.rsc2inr = new Map(); // from resource to initiator
    
    while(true) {
        await sleep(1000 * 60 * 10); // 10 min.
        await gc();
    }
})();

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
    if (request.target !== 'offscreen')
        return false;

    switch (request.type) {
        case 'page':
            if(__HD__page(request, sendResponse));
                return true;
            break;
        case 'regex':
            if(__HD__regex(request, sendResponse));
                return true;
            break;
        case 'rsc':
            if(__HD__resource(request, sendResponse));
                return true;
            break;
        case 'webRequest':
            webRequest(request.data)
            break;
        case 'devtools':
            devtools(request.data);
            break;
        default:
            console.warn(`Unexpected request type received: '${request.type}'.`);
    }
    
    return false;
});

async function webRequest(data) {
    const release = await self.requestMutex.acquireQueued();
    if(!self.IDB) {
        release();
        return;
    }

    if(data.type === 'sub_frame') {
        if(data.initiator.includes('chrome-extension://'))
            data.initiator = (new URL(data.url)).origin;
    }
    
    if(!data.initiator || !self.initiatorCache.has(data.initiator)) {
        release();
        return;
    }
    self.rsc2inr.set(data.url, data.initiator);

    for(const regx of self.initiatorCache.get(data.initiator)?.regx)
        if(regx && data.url.match(regx)) {
            release();
            return;
        }

    const pages = await self.IDB.get('PAGE_LIST');
    let pageId = '';
    let resourceList = await self.IDB.get(data.initiator) || null;
    if(resourceList && !resourceList.get(data.url)) {
        for (const key of Object.keys(pages)) {
            if(data.url.includes(pages[key].url)) // pages[key].initiator
                !pages[key].ip && (pages[key].ip = data.ip);

            if(data.initiator == pages[key].initiator)
                pageId = key;
        }

        resourceList.set(data.url, {
            frameType: data.frameType,
            ip: data.ip,
            _ip: '',
            statusCode: data.statusCode,
            method: data.method,
            _method: '',
            type: data.type,
            hash: '',
            _hash: '',
            contentSize: '',
            _contentSize: '',
            lastAccessTime: (new Date()).getTime(),
            pageId: pageId
        });
        
        await self.IDB.set(data.initiator, resourceList);
    }
    else {
        for (const key of Object.keys(pages)) {
            if(data.initiator == pages[key].initiator)
                pageId = key;
        }
    }
    
    if(pageId && data.type === 'sub_frame') {
        pages[pageId].mainframeCode = data.statusCode;
    }
    await self.IDB.set('PAGE_LIST', pages);

    release();
}

async function gc() {
    const release = await self.requestMutex.acquireQueued();

    const pages = await self.IDB.get('PAGE_LIST');
    for(const key of Object.keys(pages)) {
        const resourceList = await self.IDB.get(pages[key].initiator);
        resourceList && resourceList.forEach((e,key) => {
            if(new Date().getTime() - new Date(e.lastAccessTime).getTime() > 1000 * 60 * 60 * 24) // 24 h.
                resourceList.delete(key);
        });
        await self.IDB.set(pages[key].initiator, resourceList);
    }

    release();
}

async function devtools(data) {
    const flag = {
        hash: 'normal',
        ip: 'normal',
        method: 'normal',
        contentSize: 'normal',
        // statusCode: 'normal',
    };
    if(self.IDB) {
        const release = await self.requestMutex.acquireQueued();
        let initiator = self.rsc2inr.get(data.url);
        let resourceList = await self.IDB.get(initiator || '');

        if(resourceList) {
            let infoObj = resourceList.get(data.url);
            if(infoObj) {
                if(!infoObj.hash)
                    flag.hash = 'new'
                else if(data.hash && infoObj.hash !== data.hash) {
                    //console.log(`[*] detect defacement attack! hash: ${infoObj.hash} => ${data.hash}`);
                    flag.hash = 'attack';
                }
                if(!infoObj.ip)
                    flag.ip = 'new';
                else if(data.serverIPAddress && infoObj.ip !== data.serverIPAddress) {
                    //console.log(`[*] detect defacement attack! ip: ${infoObj.ip} => ${data.serverIPAddress}`);
                    flag.ip = 'attack';
                }
                if(!infoObj.method)
                    flag.method = 'new';
                else if(data.method && infoObj.method !== data.method) {
                    //console.log(`[*] detect defacement attack! method: ${infoObj.method} => ${data.method}`);
                    flag.method = 'attack';
                }
                if(!Number.isInteger(infoObj.contentSize))
                    flag.contentSize = 'new';
                else if(data.contentSize && infoObj.contentSize !== data.contentSize) {
                    //console.log(`[*] detect defacement attack! contentSize: ${infoObj.contentSize} => ${data.contentSize}`);
                    flag.contentSize = 'attack';
                }

                // hash값이 한번씩 바뀌었다가 원래대로 돌아오는 경우가 있음. 그때마다 어떤 리소스가 바뀌었는지를 알 수가 없으므로 확인하기 위해서.
                if(!infoObj._hash)
                    infoObj._hash = data.hash;
                else if(infoObj._hash != data.hash && infoObj.hash != data.hash)
                    infoObj._hash = data.hash;
                if(!infoObj._ip)
                    infoObj._ip = data.serverIPAddress;
                else if(infoObj._ip != data.serverIPAddress && infoObj.ip != data.serverIPAddress)
                    infoObj._ip = data.serverIPAddress;
                if(!infoObj._method)
                    infoObj._method = data.method;
                else if(infoObj._method != data.method && infoObj.method != data.method)
                    infoObj._method = data.method;
                if(!infoObj._contentSize)
                    infoObj._contentSize = data.contentSize;
                else if(infoObj._contentSize != data.contentSize && infoObj.contentSize != data.contentSize)
                    infoObj._contentSize = data.contentSize;
                

                const pages = await self.IDB.get('PAGE_LIST');

                // priority: attack > new > normal
                if(flag.hash === 'attack' || flag.ip === 'attack' || flag.method === 'attack' || flag.contentSize === 'attack') {
                    if(priority.attack < pages[infoObj.pageId].state)
                        pages[infoObj.pageId].state = priority.attack;
                }
                else if(flag.hash === 'new' || flag.ip === 'new' || flag.method === 'new' || flag.contentSize === 'new') {
                    if(priority.new < pages[infoObj.pageId].state)
                        pages[infoObj.pageId].state = priority.new;
                }
                else {
                    if(priority.normal < pages[infoObj.pageId].state)
                        pages[infoObj.pageId].state = priority.normal;
                }

                await self.IDB.set('PAGE_LIST', pages);

                /*
                if(data.statusCode && infoObj.statusCode !== data.statusCode) {
                    console.log(`[*] Network connection error! statusCode: ${infoObj.statusCode} => ${data.statusCode}`);
                    flag.statusCode = true;
                }
                */
                infoObj.lastAccessTime = (new Date()).getTime();
                
                await self.IDB.set(initiator, resourceList);
            }
        }
        release();
    }
}
