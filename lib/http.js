import { __assign } from "tslib";
import { Observable, Subject, throwError } from "rxjs";
import { catchError, mergeMap, tap } from "rxjs/operators";
import { AllOneHttp } from "./base/all-one-http";
import { Cache } from "./cache";
var Http = /** @class */ (function () {
    function Http(httpOpts) {
        var _this = this;
        this.store = {};
        this.hostUrl = "";
        this.maxRetry = 4;
        this.globalHeaders = {};
        this.globalHeadersPriority = {};
        this.withCredentials = true;
        this.appendParams2 = function (params2) {
            if (params2 === void 0) { params2 = {}; }
            if (_this.ticketKey && _this.ticketValue) {
                params2.headers = params2.headers || {};
                params2.headers = params2.priorityHeaders
                    ? __assign(__assign(__assign({}, _this.globalHeaders), _this.globalHeadersPriority), params2.headers) : __assign(__assign(__assign({}, _this.globalHeaders), params2.headers), _this.globalHeadersPriority);
            }
            if (!params2.retryMax)
                params2.retryMax = _this.maxRetry;
            if (params2.retryCurrent === undefined)
                params2.retryCurrent = 0;
            return params2;
        };
        this.httpSendBeforeHook = new Subject();
        this.httpReceiveHook = new Subject();
        this.httpReceiveErrorHook = new Subject();
        this.cacheXhr = function (params) { return _this.cache.cacheXhr(params); };
        this.xhr = function (method, relativeUrl, params, params2) {
            var url = (params2 && params2.root) || !_this.hostUrl
                ? relativeUrl
                : _this.hostUrl +
                    (relativeUrl[0] === "/" ? relativeUrl : "/" + relativeUrl);
            var valueChangePostParams = {
                url: url,
                relativeUrl: relativeUrl,
                method: method,
                params: params,
                params2: params2,
            };
            _this.httpSendBeforeHook.next(valueChangePostParams);
            params2 = _this.appendParams2(params2);
            _this.beforeFn && _this.beforeFn(params, params2);
            var withCredentials = params2.withCredentials === undefined
                ? _this.withCredentials
                : params2.withCredentials;
            var httpSub = params2.notQueue
                ? _this.http.baseHttp.send(method, url, params, params2.headers, withCredentials)
                : _this.http.xhr({
                    method: method,
                    url: url,
                    params: params,
                    headers: params2.headers,
                    key: params2.key,
                    withCredentials: withCredentials,
                });
            return httpSub.pipe(mergeMap(function (result) {
                return new Observable(function (ob) {
                    if (params2.retryCurrent &&
                        params2.retryCurrent > params2.retryMax)
                        return ob.error("over max retry");
                    if (_this.afterFn) {
                        _this.afterFn({
                            params: params,
                            params2: params2,
                            result: result,
                            retry: function () {
                                params2.retryCurrent++;
                                return _this.xhr(method, relativeUrl, params, params2);
                            },
                        })
                            .then(function (resultNext) {
                            ob.next(resultNext);
                            ob.complete();
                        })
                            .catch(function (err) {
                            ob.error(err);
                        });
                    }
                    else {
                        ob.next(result);
                        ob.complete();
                    }
                });
            }), catchError(function (err) {
                _this.httpReceiveErrorHook.next(Object.assign(valueChangePostParams, { result: err }));
                return throwError(err);
            }), tap(function (result) {
                _this.httpReceiveHook.next(Object.assign(valueChangePostParams, { result: result }));
            }));
        };
        this.cache = new Cache(this);
        this.requestLib = (httpOpts && httpOpts.requestLib) || "auto";
        this.http = new AllOneHttp(this.requestLib);
    }
    Http.prototype.setWithCredentials = function (v) {
        this.withCredentials = v;
    };
    Http.prototype.setGlobalHeader = function (key, value, priority) {
        priority
            ? (this.globalHeadersPriority[key] = value)
            : (this.globalHeaders[key] = value);
    };
    Http.prototype.clearGlobalHeader = function (key) {
        delete this.globalHeaders[key];
    };
    Http.prototype.setGlobalHeaders = function (headers) {
        Object.assign(this.globalHeaders, headers);
    };
    Http.prototype.clearGlobalHeaders = function () {
        this.globalHeaders = {};
    };
    Http.prototype.setBeforeHandler = function (fn) {
        this.beforeFn = fn;
    };
    Http.prototype.setAfterHandler = function (fn) {
        this.afterFn = fn;
    };
    Http.prototype.setHost = function (host) {
        this.hostUrl = host;
    };
    Http.prototype.setTicketKey = function (key) {
        this.ticketKey = key;
        if (this.ticketValue)
            this.setGlobalHeader(this.ticketKey, this.ticketValue, true);
    };
    Http.prototype.setTicketValue = function (v) {
        this.ticketValue = v;
        if (this.ticketKey)
            this.setGlobalHeader(this.ticketKey, this.ticketValue, true);
    };
    Http.prototype.setMaxRetry = function (v) {
        this.maxRetry = v;
    };
    return Http;
}());
export { Http };
export var http = new Http();
