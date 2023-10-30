"use strict";
console.log('load t_search.js');

(async () => {
  
})();

self.addEventListener('message', ({data: msg}) => {
    switch(msg.type) {
      case 'search':
        search(msg.code, msg.options);
        break;
    }
});

async function search(code, options) {
  let data = await fetch(`https://api.finance.naver.com/siseJson.naver?symbol=${code}&requestType=1&startTime=${options.startTime}&endTime=${options.endTime}&timeframe=${options.timeframe}`, {
    "method": "POST",
  })
  .then(res => res.text())
  .then(data => JSON.parse(data.replaceAll('\'', '\"')))

  self.postMessage({
      type: 'search',
      data: data
  });
}

//JSON.parse(`[['날짜', '시가', '고가', '저가', '종가', '거래량', '외국인소진율'],["20230922", 68300, 68900, 68300, 68800, 9420898, 53.19]]`.replaceAll('\'', '\"'))


/*

*/