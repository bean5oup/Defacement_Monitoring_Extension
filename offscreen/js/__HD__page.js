"use strict";
import {priority} from '/lib/Util.js';

export function __HD__page(req, sendResponse) {
    switch(req.cmd) {
        case 'init':
            init(sendResponse);
            return true;
            break;
        case 'add':
            add(req, sendResponse);
            return true;
            break;
        case 'remove':
            remove(req, sendResponse);
            return true;
            break;
        default:
            console.warn(`Unexpected request cmd received: '${req.cmd}'.`);
    }
    
    return false;
}

function init(sendResponse) {
    self.rsc2inr = new Map();
    sendResponse({
        type: 'success',
    });
}

async function add(req, sendResponse) {
    const release = await self.requestMutex.acquireQueued();
    try{
        const pageList = await self.IDB.get('PAGE_LIST');

        if(await self.IDB.get(req.url))
           throw 'The URL already exists.';

        const key = (new Date()).getTime();
        pageList[key] = {
            name: req.name,
            url: req.url,
            initiator: req.initiator,
            ip: req.ip,
            regx: req.regx,
            state: priority.normal,
            mainframeCode: 204
        };

        await self.IDB.set('PAGE_LIST', pageList);
        await self.IDB.set(req.initiator, new Map());
        self.initiatorCache.set(req.initiator, {
            key: key,
            regx: req.regx.map(e => {
                if(e != '')
                    return new RegExp(e);
                return null;
            })
        });
        
        sendResponse({
            type: 'success'
        });
    }
    catch(e) {
        sendResponse({
            type: 'error',
            data: e
        });
    }
    finally {
        release();
    }
}

async function remove(req, sendResponse) {
    const release = await self.requestMutex.acquireQueued();
    try{
        const pageList = await self.IDB.get('PAGE_LIST');

        for(const key of req.key) {
            await self.IDB.remove(pageList[key].initiator);
            self.initiatorCache.delete(pageList[key].initiator);
            if(!delete pageList[key])
                throw 'The key doesn\'t exists.'; 
        }

        await self.IDB.set('PAGE_LIST', pageList);

        sendResponse({
            type: 'success'
        });
    }
    catch(e) {
        sendResponse({
            type: 'error',
            data: e
        });
    }
    finally {
        release();
    }
}