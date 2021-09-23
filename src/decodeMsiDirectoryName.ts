/// Decode algorithm from https://stackoverflow.com/questions/9734978/view-msi-strings-in-binary
/// and https://github.com/SheetJS/js-cfb/issues/3

// This function do almost the same as Base64 encoding used for example in MIME (see 6.8 in http://www.ietf.org/rfc/rfc2045.txt).
// Base64 convert codes from 0 till 63 (0x3F) to the corresponding character from the array 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
// This function convert it to the corresponding character from the another array '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz._'
function decode_msi_char(x: number): number {
    switch(true) {
        case x<10:  return x + 48;
        case x<36:  return x + 55;
        case x<62:  return x + 61;
        case x==62: return 46;
    }
    return 95;
}


export function decodeMsiDirectoryName(name: string): string{
    let ch = name.charCodeAt(0);
    let idx = 0;
    const out = [];
    if(ch == 0x4840) ++idx; // TODO: is this actually supposed to be a null byte?
    while ((ch = name.charCodeAt(idx++))) {
        if(ch >= 0x3800 && ch < 0x4840 ) {
            // a part of Unicode charecterd used with CJK Unified Ideographs Extension A. (added with Unicode 3.0) used by
            // Windows Installer for encoding one or two ANSI characters. This subset of Unicode characters are not currently
            // used nether in "MS PMincho" or "MS PGothic" font nor in "Arial Unicode MS"
            if(ch >= 0x4800) {// 0x4800 - 0x483F
                // only one charecter can be decoded
                ch = decode_msi_char(ch-0x4800);
            } else { // 0x3800 - 0x383F
                // the value contains two characters
                ch -= 0x3800;
                out.push(String.fromCharCode(decode_msi_char(ch & 0x3f)));
                ch = decode_msi_char( (ch>>6) & 0x3f);
            }
        }
        // all characters lower as 0x3800 or higher or equel to 0x4840 will be saved without any decoding
        out.push(String.fromCharCode(ch));
    }
    
    return out.join("");
}