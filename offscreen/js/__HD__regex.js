"use strict";

export function __HD__regex(req, sendResponse) {
    switch(req.cmd) {
        case 'update':
            regexUpdate(req, sendResponse);
            return true;
            break;
        default:
            console.warn(`Unexpected request cmd received: '${req.cmd}'.`);
    }
    
    return false;
}

async function regexUpdate(req, sendResponse) {
    const release = await self.requestMutex.acquireQueued();
    try{
        const pageList = await self.IDB.get('PAGE_LIST');
        pageList[self.initiatorCache.get(req.initiator).key].regx = req.regx;

        self.initiatorCache.get(req.initiator).regx = req.regx.map(e => {
            if(e != '')
                return new RegExp(e.replaceAll('?', '\\?'));
            return null;
        });

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