/*
 * Service-worker는 initiator 용으로만 사용함. 해당 url이 어디서 부터 시작되었는지
 */

import {offscreenUrl} from '/lib/Util.js';

(async () => {
    if (!(await chrome.offscreen.hasDocument())) {
        await chrome.offscreen.createDocument({
            url: offscreenUrl,
            reasons: ['DOM_PARSER'], // reasons: ['WORKERS']
            justification: 'reason for multi-threading',
        });
    }
})();

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
    if(request.target !== 'service-worker')
        return;
    
    switch(request.type) {
        case 'offscreen':
            // for offscreen control
            break;
        default:
            console.warn(`Unexpected request type received: '${request.type}'.`);
    }
    return false;
});

function getResource(r) {
    chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'webRequest',
        data: r
    });
    // console.log(r.type + ': ' + r.url);
}

chrome.webRequest.onCompleted.addListener(getResource, {
    urls: ["https://*/*", "http://*/*"],
    types: ['sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'media', 'other']
}, ['responseHeaders', 'extraHeaders']);

/*
"main_frame"
Specifies the resource as the main frame.

"sub_frame"
Specifies the resource as a sub frame.

"stylesheet"
Specifies the resource as a stylesheet.

"script"
Specifies the resource as a script.

"image"
Specifies the resource as an image.

"font"
Specifies the resource as a font.

"object"
Specifies the resource as an object.

"xmlhttprequest"
Specifies the resource as an XMLHttpRequest.

"ping"
Specifies the resource as a ping.

"csp_report"
Specifies the resource as a Content Security Policy (CSP) report.

"media"
Specifies the resource as a media object.

"websocket"
Specifies the resource as a WebSocket.

"webbundle"
Specifies the resource as a WebBundle.

"other"
Specifies the resource as a type not included in the listed types.
*/