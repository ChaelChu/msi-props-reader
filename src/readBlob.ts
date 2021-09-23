export function readBlob(blob: Blob): Promise<ArrayBuffer> {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(blob);
    return new Promise<ArrayBuffer>(resolve => {
        fileReader.onload = (event) => {
            if (!event.target || event.target.readyState !== FileReader.prototype.DONE) {
                throw new Error("Read data failed");
            }
            const array = event.target.result as ArrayBuffer;
            resolve(array);
        };
    });
}