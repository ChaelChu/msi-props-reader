import * as crypto from "crypto";

function toHex(n: number): string { 
    let hex = n.toString(16);
    if (hex.length < 2) {
         hex = "0" + hex;
    }
    return hex;
}

export async function getSha256(array: ArrayBuffer): Promise<string> {
    const digest = await crypto.createHash("sha256").update(new Uint8Array(array)).digest();
    const bytes = new Uint8Array(digest);            
    return Array.from(bytes).map(b => toHex(b)).join('');
}

export function base64ToFile(dataBase64: string): File{
    const arrayBuffer = Uint8Array.from(window.atob(dataBase64), c => c.charCodeAt(0));
    //const arrayBuffer = Buffer.from(dataBase64, 'base64')
    const file = new File([arrayBuffer], "test.msi", {type: 'application/octet-stream'});
    return file;
}