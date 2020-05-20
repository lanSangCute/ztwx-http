import { __extends } from "tslib";
import { BaseHttp } from "./base-http";
import { allOneManage } from "./all-one-manage";
import { Observable, Subject } from "rxjs";
var AllOneHttp = /** @class */ (function (_super) {
    __extends(AllOneHttp, _super);
    function AllOneHttp() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.xhr = function (_a) {
            var method = _a.method, url = _a.url, params = _a.params, headers = _a.headers, key = _a.key;
            var xhrKey = _this.generateKey(key, method, url, params);
            var existXhr = allOneManage.exists(xhrKey);
            return new Observable(function (ob) {
                var handleEnd = function () {
                    allOneManage.remove(xhrKey);
                };
                var handleResult = function (result) {
                    handleEnd();
                    ob.next(result);
                    ob.complete();
                };
                var handleError = function (err) {
                    handleEnd();
                    ob.error(err);
                };
                var runningSubscription;
                if (existXhr) {
                    existXhr.subscription.unsubscribe();
                    existXhr.subscription = existXhr.observer.subscribe(function (result) { return handleResult(result); }, function (err) { return handleError(err); });
                    runningSubscription = existXhr.oneSubscription;
                }
                else {
                    var subject_1 = new Subject();
                    var newSubscription = subject_1.subscribe(function (result) { return handleResult(result); }, function (err) { return handleError(err); });
                    runningSubscription = _super.prototype.send.call(_this, method, url, params, headers)
                        .subscribe(function (result) { return subject_1.next(result); }, function (err) { return subject_1.error(err); });
                    allOneManage.append(xhrKey, subject_1, newSubscription, runningSubscription);
                }
                var oldUnsubscribe = ob.unsubscribe;
                ob.unsubscribe = function () {
                    runningSubscription.unsubscribe();
                    handleEnd();
                    oldUnsubscribe.call(ob);
                };
            });
        };
        return _this;
    }
    /***
     * generate unique key
     * @param key
     * @param method
     * @param url
     * @param params
     */
    AllOneHttp.prototype.generateKey = function (key, method, url, params) {
        if (key)
            return key;
        if (this.isJsonMethod(method)) {
            return method + "--" + url + "--" + params ? JSON.stringify(params) : "";
        }
        else {
            return url;
        }
    };
    return AllOneHttp;
}(BaseHttp));
export { AllOneHttp };