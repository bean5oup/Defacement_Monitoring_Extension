'use strict';

import {$, $$, asyncRuntimeMessage, statusCode, date2yyyymmddhhmm, priority} from '/lib/Util.js';
import {IndexedDB} from '/lib/IndexedDB.js';

chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
    if(request.type !== 'IDB_EVENT' && request.target !== 'options')
        return;
    
    switch(request.type) {
        case 'IDB_EVENT':
            IDBEventHandler(request.event);
            break;
        case 'scroll':
            scrollEventHandler(request);
            break;
        default:
            console.warn(`Unexpected request type received: '${request.type}'.`);
    }
    return false;
});

(async () => {
    self.IDB = new IndexedDB('Defacement', 1);
    let listURL = await self.IDB.get('PAGE_LIST');
    listURL && renderURL(listURL, '');
})();

function scrollEventHandler(req) {
    console.log(req);
    $('.codeBox').scrollTo({
        top: req.pageIndex * 40,
        behavior: 'smooth'
    });
}

// prevent for Maximum call stack size exceeded error
function _arrayBufferToBase64(buffer) {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    for (let i = 0, len = bytes.byteLength; i < len; i++)
        binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function renderURL(list, query) {
    let chkList = [...$$('.codeBox > table > tbody > tr > td > input:checked')].map((e) => e.parentElement.parentElement.querySelector('#name').title);
    $('.codeBox > table > tbody').innerHTML = '';
    
    let num = 0;
    for(const key of Object.keys(list)) {
        let tr = document.createElement('tr');
        tr.id = key;
        tr.addEventListener('click', (e) => {
            if(e.target.tagName == 'LABEL' || e.target.tagName == 'INPUT')
                return;

            let parent = e.target;
            while(parent.tagName !== 'TR') {
                parent = parent.parentElement;
            }

            console.log(e.target);
            if(e.target.className == 'overflowHide')
                chrome.runtime.sendMessage({
                    target: 'monitor',
                    type: 'show',
                    key: parent.id
                });  

            renderContainer(parent.id);
        });

        tr.innerHTML = `
            <td>
                <input type="checkbox" id="url_${key}" />
                <label class='chkBox' for="url_${key}"></label>
            </td>
            <td id='idx'>${num}</td>
            <td id='name' title='${list[key].name}'><div class='overflowHide'>${list[key].name}<div></td>
            <td>
                <div class='status'></div>
            </td>
        `;


        // querySelectorAll로 해야 나중에 무한스크롤때 적용 가능함.
        // renderURL에 self.displayFlag 만들어서 true일 때 중복해서 렌더링 시키면 될 듯.
        switch(list[key].state) {
            case priority.attack:
                tr.querySelector('td > .status').style.backgroundColor = 'red';
                break;
            case priority.new:
                tr.querySelector('td > .status').style.backgroundColor = 'blue';
                break;
            case priority.normal:
                tr.querySelector('td > .status').style.backgroundColor = 'rgb(24, 128, 56)';
                break;
        }

        if(200 <= list[key].mainframeCode && list[key].mainframeCode < 300)
            tr.style.backgroundColor = '';
        else if(300 <= list[key].mainframeCode && list[key].mainframeCode < 400)
            tr.style.backgroundColor = '#F29900';
        else
            tr.style.backgroundColor = 'red';

        if(chkList.includes(list[key].name))
            tr.querySelector('td > input').checked = true;

        if(!isNaN(parseInt(query)) && parseInt(query) !== num)
            tr.style.display = 'none';
        else if(isNaN(parseInt(query)) && !list[key].name.startsWith(query))
            tr.style.display = 'none';
        
        $('.codeBox > table > tbody').append(tr);
        num++;
    }
}

async function renderContainer(id) {
    let listURL = await self.IDB.get('PAGE_LIST');
    $('.info_pane > .infoName > input').value = listURL[id].name;
    $('.info_pane > .infoName > input').id = id;
    $('.info_pane > div > .infoURL > input').value = listURL[id].url;
    $('.info_pane > div > .infoInitiator > input').value = listURL[id].initiator;
    $('.info_pane > div > .infoIP > input').value= listURL[id].ip;
    $('.regex > textarea').value = listURL[id].regx.map(e => e+'\n').join('').slice(0, -1);
    //$('#rightContainer > iframe').src = listURL[id].url;

    let rscList = await self.IDB.get(listURL[id].initiator);
    $('.infoName.Resource > span > .cnt').innerText = rscList.size;
    $('.info_pane > .scrollOver > table > tbody').innerHTML = '';
    rscList && rscList.forEach((data, url) => {
        let tr = document.createElement('tr');
        tr.title = url;
        tr.setAttribute('tabindex', -1);
        tr.setAttribute('contentSize', data.contentSize);
        tr.setAttribute('frameType', data.frameType);
        tr.setAttribute('hash', data.hash);
        tr.setAttribute('ip', data.ip);
        tr.setAttribute('lastAccessTime', data.lastAccessTime);
        tr.setAttribute('method', data.method);
        tr.setAttribute('statusCode', data.statusCode);
        tr.setAttribute('type', data.type);

        tr.setAttribute('_contentSize', data._contentSize);
        tr.setAttribute('_hash', data._hash);
        tr.setAttribute('_ip', data._ip);
        tr.setAttribute('_method', data._method);

        let rscState = 'rscNew'; // rscNormal, rscAttack
        if(!Number.isInteger(data.contentSize) || !data.hash || !data.ip || !data.method)
            rscState = 'rscNew';
        else if((data._contentSize && data.contentSize !== data._contentSize)
                || (data._hash && data.hash !== data._hash)
                || (data._ip && data.ip !== data._ip)
                || (data._method && data.method !== data._method))
            rscState = 'rscAttack';
        else
            rscState = 'rscNormal';
        
        tr.innerHTML = `
            <td class='${rscState}'></td>
            <td class='rscDelete'>❌</td>
            <td class='rscRefresh'><img src='/assets/img/refresh-button.png' class='refreshIcon' /></td>
            <td class='rscStatus'><div class='statusRing'></div>${data.statusCode}</td>
            <td class='rscURL'><input type='text' readonly></input></td>
        `;

        if(200 <= data.statusCode && data.statusCode < 300)
            tr.querySelector('.rscStatus > .statusRing').style.backgroundColor = '#188038';
        else if(300 <= data.statusCode && data.statusCode < 400)
            tr.querySelector('.rscStatus > .statusRing').style.backgroundColor = '#F29900';
        else
            tr.querySelector('.rscStatus > .statusRing').style.backgroundColor = '#D93025';

        tr.querySelector('.rscStatus').title = statusCode.get(data.statusCode);
        
        tr.querySelector('.rscURL > input').value = url;

        tr.querySelector('.rscDelete').addEventListener('click', async (e) => {
            let parent = e.target;
            while(parent.tagName !== 'TR') {
                parent = parent.parentElement;
            }

            let res = await asyncRuntimeMessage({
                target: 'offscreen',
                type: 'rsc',
                cmd: 'delete',
                initiator: $('.infoInitiator > input').value || '',
                url: parent.title
            });

            if(res?.type == 'success') {
                parent.remove();
                $('.infoName.Resource > span > .cnt').innerText = parseInt($('.infoName.Resource > span > .cnt').innerText)-1;
            }
        });
        tr.querySelector('.rscRefresh').addEventListener('click', async (e) => {
            let parent = e.target;
            while(parent.tagName !== 'TR') {
                parent = parent.parentElement;
            }

            let status = '';
            let buf = await fetch(parent.querySelector('.rscURL > input').value, {
                method: parent.getAttribute('method') || 'GET'
            })
            .then(res => {
                status = res.status;
                return res.arrayBuffer()
            });

            let res = await asyncRuntimeMessage({
                target: 'offscreen',
                type: 'rsc',
                cmd: 'refresh',
                initiator: $('.infoInitiator > input').value || '',
                url: parent.title,
                hash: md5(_arrayBufferToBase64(buf)),
                contentSize: buf.byteLength,
                statusCode: status,
                lastAccessTime: (new Date()).getTime()
            });

            if(res?.type == 'success') {
                renderContainer($('.info_pane > .infoName > input').id);
            }
            else {
                alert('error');
            }

            //console.log(md5(btoa(String.fromCharCode.apply(null, new Uint8Array(buf)))), buf.byteLength);
        });
        tr.querySelector('.rscURL').addEventListener('click', (e) => {
            let parent = e.target;
            while(parent.tagName !== 'TR') {
                parent = parent.parentElement;
            }

            parent.focus();

            for(const input of $$('.infoContent > div > input'))
                input.title = '';
            for(const change of $$('.infoContent > div > div'))
                change.classList.remove('change');

            for(const attr of [...parent.attributes].map(e => e.name))
                switch(attr) {
                    case 'hash':
                        if(parent.getAttribute('_hash') && parent.getAttribute('hash') !== parent.getAttribute('_hash')) {
                            $('.infoHash > div').classList.add('change');
                            $('.infoHash > input').title = '=>' + parent.getAttribute('_hash');
                        }
                        break;
                    case 'contentsize':
                        if(parent.getAttribute('_contentsize') && parent.getAttribute('contentsize') !== parent.getAttribute('_contentsize')) {
                            $('.infoContentSize > div').classList.add('change');
                            $('.infoContentSize > input').title = '=>' + parent.getAttribute('_contentsize');
                        }
                        break;
                    case 'ip':
                        if(parent.getAttribute('_ip') && parent.getAttribute('ip') !== parent.getAttribute('_ip')) {
                            $('.infoRscIP > div').classList.add('change');
                            $('.infoRscIP > input').title = '=>' + parent.getAttribute('_ip');
                        }
                        break;
                    case 'method':
                        if(parent.getAttribute('_method') && parent.getAttribute('method') !== parent.getAttribute('_method')) {
                            $('.infoMethod > div').classList.add('change');
                            $('.infoMethod > input').title = '=>' + parent.getAttribute('_method');
                        }
                        break;
                }
            $('.infoHash > input').value = parent.getAttribute('hash');
            $('.infoContentSize > input').value = parent.getAttribute('contentSize');
            $('.infoRscIP > input').value = parent.getAttribute('ip');
            $('.infoMethod > input').value = parent.getAttribute('method');
            $('.infoStatusCode > input').value = parent.getAttribute('statusCode');
            $('.infoType > input').value = parent.getAttribute('type');
            $('.infoLastAccessTime > input').value = date2yyyymmddhhmm(new Date(parseInt(parent.getAttribute('lastAccessTime'))));
        });
        
        $('.info_pane > .scrollOver > table > tbody').append(tr);
    });
}

async function IDBEventHandler(evt) {
    if(!self.IDB)
        return;
    
    switch(evt) {
        case 'get':
            break;
        case 'set':
            let listURL = await self.IDB.get('PAGE_LIST');
            listURL && renderURL(listURL, '');

            //let id = $('.info_pane > .infoName > input').id;
            //id && renderContainer(id);
            break;
    }
}

$('.btnUpdate.Resource').addEventListener('click', async (e) => {
    const res = await asyncRuntimeMessage({
        target: 'offscreen',
        type: 'rsc',
        cmd: 'update',
        initiator: $('.infoInitiator > input').value || '',
        pageId: parseInt($('.info_pane > .infoName > input').id) || 0
    });
    renderContainer($('.info_pane > .infoName > input').id);
});

$('.btnUpdate.Regex').addEventListener('click', async (e) => {
    const res = await asyncRuntimeMessage({
        target: 'offscreen',
        type: 'regex',
        cmd: 'update',
        initiator: $('.infoInitiator > input').value || '',
        regx: $('.regex > textarea').value.split('\n')
    });
    renderContainer($('.info_pane > .infoName > input').id);
});


$('.navAdd').addEventListener('click', async (e) => {
    try{
        let res = await asyncRuntimeMessage({
            target: 'offscreen',
            type: 'page',
            cmd: 'add',
            name: $('.infoName > input').value,
            url: $('.infoURL > input').value,
            initiator: (new URL($('.infoURL > input').value)).origin,
            ip: $('.infoIP > input').value,
            regx: $('.regex > textarea').value.split('\n')
        });

        if(res.type == 'success')
            throw 'success';
        else
            throw res.data;
    }
    catch(e) {
        alert(e);
    }
});

$('.navRemove').addEventListener('click', async (e) => {
    try {
        let chkList = [...$$('.codeBox > table > tbody > tr > td > input:checked')].map((e) => e.parentElement.parentElement.id);

        if(!chkList.length)
            return;

        let res = await asyncRuntimeMessage({
            target: 'offscreen',
            type: 'page',
            cmd: 'remove',
            key: chkList
        });

        if(res.type == 'success')
            throw 'success';
        else
            throw res.data;
    }
    catch(e) {
        alert(e);
    }
});

$('.searchBox > input').addEventListener('input', (e) => {
    switch(e.target.value) {
        case ':display':
            display();
            break;
        default:
            sort8stop(e.target.value);
            break;
    }
});

async function display() {
    chrome.runtime.sendMessage({
        type: 'display',
        target: 'monitor'
    });
    let listURL = await self.IDB.get('PAGE_LIST');
    renderURL(listURL, '');
}

async function sort8stop(query) {
    chrome.runtime.sendMessage({
        type: 'stop',
        target: 'monitor'
    });
    let listURL = await self.IDB.get('PAGE_LIST');
    renderURL(listURL, query);
}