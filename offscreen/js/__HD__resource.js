"use strict";
import {priority} from '/lib/Util.js';

export function __HD__resource(req, sendResponse) {
    switch(req.cmd) {
        case 'update':
            rscUpdate(req, sendResponse);
            return true;
            break;
        case 'refresh':
            rscRefresh(req, sendResponse);
            return true;
            break;
        case 'delete':
            rscDelete(req, sendResponse);
            return true;
            break;
        default:
            console.warn(`Unexpected request cmd received: '${req.cmd}'.`);
    }
    
    return false;
}

async function rscUpdate(req, sendResponse) {
    const release = await self.requestMutex.acquireQueued();
    try{
        const rscList = await self.IDB.get(req.initiator);
        if(rscList) {
            const pages = await self.IDB.get('PAGE_LIST');
            pages[req.pageId].state = priority.normal;
            await self.IDB.set('PAGE_LIST', pages);
            
            rscList.forEach((data, key) => {
                Number.isInteger(data._contentSize) && (data.contentSize = data._contentSize) && (data._contentSize = '');
                data._hash && (data.hash = data._hash) && (data._hash = '');
                data._ip && (data.ip = data._ip) && (data._ip = '');
                data._method && (data.method = data._method) && (data._method = '');
            });
            await self.IDB.set(req.initiator, rscList);

            sendResponse({
                type: 'success'
            });
        }
        else
            throw `The ${req.initiator}'s Resource doesn't exists.`;
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

async function rscRefresh(req, sendResponse) {
    const release = await self.requestMutex.acquireQueued();
    try{
        const rscList = await self.IDB.get(req.initiator);
        if(rscList) {
            const infoObj = rscList.get(req.url);
            infoObj._hash = req.hash;
            infoObj._contentSize = req.contentSize;
            infoObj.statusCode = req.statusCode;
            infoObj.lastAccessTime = req.lastAccessTime;

            await self.IDB.set(req.initiator, rscList);
            sendResponse({
                type: 'success'
            })
        }
        else
            throw `The ${req.initiator}'s Resource doesn't exists.`;
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

async function rscDelete(req, sendResponse) {
    const release = await self.requestMutex.acquireQueued();
    try{
        const rscList = await self.IDB.get(req.initiator);
        if(rscList) {
            if(rscList.delete(req.url)) {
                await self.IDB.set(req.initiator, rscList);
                sendResponse({
                    type: 'success'
                })
            }
            else
                throw `The ${req.url} doesn't exists.`;
        }
        else
            throw `The ${req.initiator}'s Resource doesn't exists.`;
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