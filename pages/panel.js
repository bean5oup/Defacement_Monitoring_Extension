'use strict';

chrome.devtools?.network.onRequestFinished.addListener(networkHandler);

function getContent(data) {
    return new Promise((resolve, reject) => {
        data.getContent((_, encoding) => {
            if(encoding == 'base64')
                resolve(_);
            else
                resolve(btoa(unescape(encodeURIComponent(_))));
        });
    });
}

async function networkHandler(info) {
    chrome.runtime.sendMessage({
        type: 'devtools',
        data: {
            url: info.request.url,
            bodySize: info.response.bodySize,
            contentSize: info.response.content.size,
            serverIPAddress: info.serverIPAddress,
            startedDateTime: info.startedDateTime,
            statusCode: info.response.status,
            method: info.request.method,
            type: info._resourceType,
            hash: md5(await getContent(info))
        },
        target: 'offscreen'
    });
}