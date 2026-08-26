export interface ResizedImage {
  dataUrl: string;
  base64: string;
  mediaType: string;
}

export function resizeImageFile(file: File, maxEdge = 1568, quality = 0.85): Promise<ResizedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxEdge || height > maxEdge) {
          if (width > height) {
            height = Math.round((height * maxEdge) / width);
            width = maxEdge;
          } else {
            width = Math.round((width * maxEdge) / height);
            height = maxEdge;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas_context_failed"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ dataUrl, base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
      };
      img.onerror = () => reject(new Error("decode_failed"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

// Lit la vraie date de prise de vue (EXIF DateTimeOriginal) directement dans le fichier JPEG.
// Ne dépend d'aucune librairie externe. Retourne un timestamp (ms) ou null si absent
// (HEIC non converti, capture d'écran, PNG, EXIF supprimé...).
export function extractExifDate(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const view = new DataView(buffer);
        if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
          resolve(null);
          return;
        }
        let offset = 2;
        while (offset + 4 <= view.byteLength) {
          const marker = view.getUint16(offset, false);
          offset += 2;
          if (marker === 0xffe1) {
            const segLength = view.getUint16(offset, false);
            const segStart = offset + 2;
            if (view.getUint32(segStart, false) === 0x45786966) {
              resolve(readExifDateTime(view, segStart + 6));
              return;
            }
            offset += segLength;
          } else if (marker === 0xffd9 || marker === 0xffda) {
            break;
          } else if ((marker & 0xff00) === 0xff00) {
            offset += view.getUint16(offset, false);
          } else {
            break;
          }
        }
        resolve(null);
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 131072));
  });
}

function readExifDateTime(view: DataView, tiffOffset: number): number | null {
  try {
    const little = view.getUint16(tiffOffset, false) === 0x4949;
    const ifd0Offset = tiffOffset + view.getUint32(tiffOffset + 4, little);
    let dateTimeStr = readIFDDateTime(view, ifd0Offset, tiffOffset, little, 0x0132);
    let exifIFDOffset: number | null = null;
    const entries = view.getUint16(ifd0Offset, little);
    for (let i = 0; i < entries; i++) {
      const entryOffset = ifd0Offset + 2 + i * 12;
      if (view.getUint16(entryOffset, little) === 0x8769) {
        exifIFDOffset = tiffOffset + view.getUint32(entryOffset + 8, little);
      }
    }
    if (exifIFDOffset) {
      const sub =
        readIFDDateTime(view, exifIFDOffset, tiffOffset, little, 0x9003) ||
        readIFDDateTime(view, exifIFDOffset, tiffOffset, little, 0x9004);
      if (sub) dateTimeStr = sub;
    }
    if (!dateTimeStr) return null;
    const m = dateTimeStr.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
  } catch {
    return null;
  }
}

function readIFDDateTime(
  view: DataView,
  ifdOffset: number,
  tiffOffset: number,
  little: boolean,
  targetTag: number,
): string | null {
  const entries = view.getUint16(ifdOffset, little);
  for (let i = 0; i < entries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (view.getUint16(entryOffset, little) === targetTag) {
      const valueOffset = tiffOffset + view.getUint32(entryOffset + 8, little);
      return readAsciiString(view, valueOffset, 19);
    }
  }
  return null;
}

function readAsciiString(view: DataView, offset: number, length: number): string {
  let str = "";
  for (let i = 0; i < length; i++) {
    if (offset + i >= view.byteLength) break;
    const code = view.getUint8(offset + i);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str;
}
