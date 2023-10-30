'use strict';

import {$, $$, asyncRuntimeMessage} from '/lib/Util.js';
import {IndexedDB} from '/lib/IndexedDB.js';

const MAX_ROW = 1; // 3
const MAX_COL = 2; // 5
const INF_LOOP = false;
const MAX_TIMEOUT = 10; // 120
self.MAX_LOAD_EVNT = 0;
self.cnt = 0;

(async () => {
    document.documentElement.style.setProperty('--max-row', MAX_ROW);
    document.documentElement.style.setProperty('--max-col', MAX_COL);
    self.IDB = new IndexedDB('Defacement', 1);

    window.addEventListener('_iframeDOMLoad', (e) => {
        self.cnt++;
        if(self.release && self.MAX_LOAD_EVNT <= self.cnt) {
            self.release();
            self.release = undefined;
            self.cnt = 0;
        }
    });
})();

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
    if(request.target !== 'monitor')
        return;
    
    switch(request.type) {
        case 'display':
            self.pageIndex = 0;
            display();
            break;
        case 'stop':
            stop();
            break;
        case 'show':
            show(request);
            break;
        default:
            console.warn(`Unexpected request type received: '${request.type}'.`);
    }
    return false;
});

function waitDOMLoad() {
    return new Promise((resolve) => {
        self.release = resolve;        
    });
}

function timer() {
    $('.navTime').innerText = self.TIMEOUT;
    if(self.TIMEOUT == 0) {
        self.TIMEOUT = MAX_TIMEOUT;
        display();
    }
    self.TIMEOUT--;
}

async function display() {
    self.TIMEOUT = MAX_TIMEOUT;
    self.interval && clearInterval(self.interval);

    iframeRender();
    await waitDOMLoad();
    self.interval = setInterval(timer, 1000);
}

async function iframeRender() {
    let res = await asyncRuntimeMessage({
        target: 'offscreen',
        type: 'page',
        cmd: 'init'
    });
    //console.log(res);
    const pageList = await self.IDB.get('PAGE_LIST');
    const urlList = Object.values(pageList)
    const MAX_INDEX = urlList.length;
    self.MAX_LOAD_EVNT = 0;

    chrome.runtime.sendMessage({
        target: 'options',
        type: 'scroll',
        pageIndex: self.pageIndex
    });
    
    let html = ``;
    for(let row = 0; row < MAX_ROW; row++) {
        html += `<div class='row'>`;
        for(let col = 0; col < MAX_COL; col++) {
            html += `<div class='col'>`;
            html += `<div class='title'><span class='circledNumber'>${self.pageIndex}</span>${urlList[self.pageIndex].name}</div>`;
            html += `<iframe src=${urlList[self.pageIndex].url}></iframe>`;
            html += `</div>`;

            self.pageIndex++;
            self.MAX_LOAD_EVNT++;
            if(self.pageIndex == MAX_INDEX)
                break;
        }
        html += `</div>`;

        if(self.pageIndex == MAX_INDEX) {
            self.pageIndex = 0;
            break;
        }
    }

    $('#main').innerHTML = html;
    $$('#main > div iframe').forEach((e) => {
        e.addEventListener('load', (load) => {
            dispatchEvent(new Event('_iframeDOMLoad'));
        })
    });
}

function stop() {
    self.interval && clearInterval(self.interval);
    if(self.release) {
        self.release();
        self.release = undefined;
    }
    self.cnt = 0;
}

async function show(req) {
    const pageList = await self.IDB.get('PAGE_LIST');
    $('#main').innerHTML = `
        <div class='title'><span class='circledNumber'>${Object.keys(pageList).indexOf(req.key)}</span>${pageList[req.key].name}</div>
        <iframe src=${pageList[req.key].url}></iframe>
    `;
}