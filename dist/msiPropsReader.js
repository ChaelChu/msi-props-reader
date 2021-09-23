"use strict";
/*
 * msi-props-reader
 * https://github.com/ChaelChu/msi-props-reader
 *
 * Copyright (c) 2021 ChaelChu
 * Licensed under the MIT license.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsiPropsReader = void 0;
var cfbReader_1 = require("./cfbReader");
var textDecode_1 = require("./textDecode");
var logger_1 = require("./logger");
var MsiPropsReader = /** @class */ (function () {
    function MsiPropsReader() {
        this._propertyKeyValueMap = {};
        this._propertyRequiredStreamIds = [];
        this._streamBytes = {};
    }
    MsiPropsReader.prototype.initialize = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var cfbReader, property, stringPool, stringData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cfbReader_1.CfbReader.getReader(file)];
                    case 1:
                        cfbReader = _a.sent();
                        return [4 /*yield*/, cfbReader.readStreamByName('Property')];
                    case 2:
                        property = _a.sent();
                        return [4 /*yield*/, this._processProperties(property)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, cfbReader.readStreamByName('_StringPool')];
                    case 4:
                        stringPool = _a.sent();
                        return [4 /*yield*/, cfbReader.readStreamByName('_StringData')];
                    case 5:
                        stringData = _a.sent();
                        return [4 /*yield*/, this._processStrings(stringPool, stringData)];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MsiPropsReader.prototype.getProperties = function () {
        var codePage = this._codePage;
        if (codePage === undefined) {
            logger_1.Logger.error('Not initialized');
        }
        var rawProps = this.getRawProperties();
        var result = rawProps.reduce(function (obj, p) {
            obj[(0, textDecode_1.textDecode)(p.key, codePage)] = (0, textDecode_1.textDecode)(p.value, codePage);
            return obj;
        }, {});
        return result;
    };
    //---------------------------- Private --------------------------
    MsiPropsReader.prototype.getRawProperties = function () {
        var _this = this;
        var result = Object.keys(this._propertyKeyValueMap).map(function (key) { return Number(key); }).map(function (key) { return ({
            key: _this._streamBytes[key],
            value: _this._streamBytes[_this._propertyKeyValueMap[key]],
        }); });
        return result;
    };
    MsiPropsReader.prototype._processProperties = function (array) {
        var view = new DataView(array.buffer);
        this._propertyKeyValueMap = {};
        this._propertyRequiredStreamIds = [];
        if (view.byteLength % 4 != 0) {
            logger_1.Logger.error('Property table corrupted');
        }
        var countOfKeys = view.byteLength / 4;
        for (var i = 0; i < countOfKeys; i++) {
            var offset = i * 2;
            var keyStreamId = view.getUint16(offset, true);
            var valueStreamId = view.getUint16(countOfKeys * 2 + offset, true);
            this._propertyKeyValueMap[keyStreamId] = valueStreamId;
            this._propertyRequiredStreamIds.push(keyStreamId);
            this._propertyRequiredStreamIds.push(valueStreamId);
        }
    };
    MsiPropsReader.prototype._processStrings = function (stringPoolArray, stringDataArray) {
        this._streamBytes = [];
        var stringPool = new DataView(stringPoolArray.buffer);
        var stringData = new DataView(stringDataArray.buffer);
        this._codePage = stringPool.getUint16(0, true);
        if (stringPool.byteLength % 4 !== 0) {
            logger_1.Logger.error('Invalid string pool table');
        }
        var itemCount = stringPool.byteLength / 4;
        var streamId = 1;
        var higherDwordOfSize = 0;
        var stringDataOffset = 0;
        for (var i = 1; i < itemCount; i++) {
            var stringPoolOffset = i * 4;
            var size = stringPool.getUint16(stringPoolOffset, true);
            var ref = stringPool.getUint16(stringPoolOffset + 2, true);
            if (size === 0 && ref === 0) {
                // empty entry
                streamId++;
                continue;
            }
            if (size === 0 && ref !== 0) {
                // save higher four bytes of stream size
                higherDwordOfSize = ref << 16;
                continue;
            }
            size += higherDwordOfSize;
            higherDwordOfSize = 0;
            var streamRequired = this._propertyRequiredStreamIds.some(function (s) { return s === streamId; });
            if (streamRequired) {
                var data = stringData.buffer.slice(stringDataOffset, stringDataOffset + size);
                this._streamBytes[streamId] = data;
            }
            stringDataOffset += size;
            streamId++;
        }
    };
    return MsiPropsReader;
}());
exports.MsiPropsReader = MsiPropsReader;
