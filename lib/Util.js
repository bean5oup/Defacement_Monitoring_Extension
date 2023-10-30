"use strict";

export const offscreenUrl = '/offscreen/offscreen.html';

export function asyncRuntimeMessage(obj) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(obj, res => {
            resolve(res);
        });     
    });
}

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function date2ymd(date) {
    return `${date.getFullYear()}${String(date.getMonth()+1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}
export function date2yyyymmddhhmm(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * @param {String} date
 * @returns {String}
 */
export function date2y_m_d(date) {
    return `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`;
}

export const $ = sel => document.querySelector(sel);
export const $$ = sel => document.querySelectorAll(sel);

export const priority = {
    attack: 0,
    new: 1,
    normal: 2
}

export const statusCode = new Map([[100, 'Continue'],
                                [101, 'Switching Protocols'],
                                [102, 'Processing'],
                                [103, 'Early Hints'],
                                [200, 'OK'],
                                [201, 'Created'],
                                [202, 'Accepted'],
                                [203, 'Non-Authoritative Information'],
                                [204, 'No Content'],
                                [205, 'Reset Content'],
                                [206, 'Partial Content'],
                                [207, 'Multi-Status'],
                                [208, 'Already Reported'],
                                [226, 'IM Used'],
                                [300, 'Multiple Choices'],
                                [301, 'Moved Permanently'],
                                [302, 'Found'],
                                [303, 'See Other'],
                                [304, 'Not Modified'],
                                [305, 'Use Proxy'],
                                [306, 'Switch Proxy'],
                                [307, 'Temporary Redirect'],
                                [308, 'Permanent Redirect'],
                                [400, 'Bad Request'],
                                [401, 'Unauthorized'],
                                [402, 'Payment Required'],
                                [403, 'Forbidden'],
                                [404, 'Not Found'],
                                [405, 'Method Not Allowed'],
                                [406, 'Not Acceptable'],
                                [407, 'Proxy Authentication Required'],
                                [408, 'Request Timeout'],
                                [409, 'Conflict'],
                                [410, 'Gone'],
                                [411, 'Length Required'],
                                [412, 'Precondition Failed'],
                                [413, 'Request Entity Too Large'],
                                [414, 'Request-URI Too Long'],
                                [415, 'Unsupported Media Type'],
                                [416, 'Requested Range Not Satisfiable'],
                                [417, 'Expectation Failed'],
                                [418, 'I\'m a teapot'],
                                [421, 'Misdirected Request'],
                                [422, 'Unprocessable Entity'],
                                [423, 'Locked'],
                                [424, 'Failed Dependency'],
                                [425, 'Too Early'],
                                [426, 'Upgrade Required'],
                                [428, 'Precondition Required'],
                                [429, 'Too Many Requests'],
                                [431, 'Request Header Fields Too Large'],
                                [451, 'Unavailable For Legal Reasons'],
                                [500, 'Internal Server Error'],
                                [501, 'Not Implemented'],
                                [502, 'Bad Gateway'],
                                [503, 'Service Unavailable'],
                                [504, 'Gateway Timeout'],
                                [505, 'HTTP Version Not Supported'],
                                [506, 'Variant Also Negotiates'],
                                [507, 'Insufficient Storage'],
                                [508, 'Loop Detected'],
                                [510, 'Not Extended'],
                                [511, 'Network Authentication Required'],
                                [419, 'CSRF Token Missong or Expired (non-standard status code)'],
                                [420, 'Enhance Your Calm (non-standard status code)'],
                                [440, 'Login Time-out (non-standard status code)'],
                                [444, 'No Response (non-standard status code)'],
                                [449, 'Retry With (non-standard status code)'],
                                [450, 'Blocked by Windows Parental Controls (non-standard status code)'],
                                [460, 'Client closed the connection with AWS Elastic Load Balancer (non-standard status code)'],
                                [463, 'The load balancer received an X-Forwarded-For request header with more than 30 IP addresses (non-standard status code)'],
                                [494, 'Request header too large (non-standard status code)'],
                                [495, 'SSL Certificate Error (non-standard status code)'],
                                [496, 'SSL Certificate Required (non-standard status code)'],
                                [497, 'HTTP Request Sent to HTTPS Port (non-standard status code)'],
                                [498, 'Invalid Token (Esri) (non-standard status code)'],
                                [499, 'Client Closed Request (non-standard status code)'],
                                [520, 'Web Server Returned an Unknown Error (non-standard status code)'],
                                [521, 'Web Server Is Down (non-standard status code)'],
                                [522, 'Connection Timed out (non-standard status code)'],
                                [523, 'Origin Is Unreachable (non-standard status code)'],
                                [524, 'A Timeout Occurred (non-standard status code)'],
                                [525, 'SSL Handshake Failed (non-standard status code)'],
                                [526, 'Invalid SSL Certificate (non-standard status code)'],
                                [527, 'Railgun Error (non-standard status code)'],
                                [530, 'Origin DNS Error (non-standard status code)'],
                                [561, 'Unauthorized (AWS Elastic Load Balancer) (non-standard status code)']
                                  ]);