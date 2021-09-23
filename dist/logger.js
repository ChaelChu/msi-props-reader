"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var LOG_LVL = 2;
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.error = function (message) {
        this._log(message, 1);
        throw new Error(message);
    };
    Logger.warn = function (message) {
        this._log(message, 2);
    };
    Logger.trace = function (message) {
        this._log(message, 3);
    };
    Logger._log = function (message, level) {
        if (LOG_LVL && LOG_LVL >= level) {
            var str = "[CfbReader] " + message;
            switch (level) {
                case 1:
                    console.error(str);
                    break;
                case 2:
                    console.warn(str);
                    break;
                case 3:
                    console.log(str);
                    break;
                default:
                    break;
            }
        }
    };
    return Logger;
}());
exports.Logger = Logger;
