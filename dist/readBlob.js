"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBlob = void 0;
function readBlob(blob) {
    var fileReader = new FileReader();
    fileReader.readAsArrayBuffer(blob);
    return new Promise(function (resolve) {
        fileReader.onload = function (event) {
            if (!event.target || event.target.readyState !== FileReader.prototype.DONE) {
                throw new Error("Read data failed");
            }
            var array = event.target.result;
            resolve(array);
        };
    });
}
exports.readBlob = readBlob;
