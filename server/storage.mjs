// 파일 보관(수업 PDF): 서버 로직은 Cloudflare R2 형식(put/get/delete)으로 쓰여 있어서,
// 같은 형식의 호출을 Vercel Blob(비공개 저장소)으로 이어 준다.
import { put, get, del } from '@vercel/blob';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const toBuffer = async value => value instanceof Uint8Array ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : value instanceof ArrayBuffer ? Buffer.from(value) : Buffer.from(await new Response(value).arrayBuffer());

function blobBucket() {
  return {
    async put(key, value, options = {}) {
      await put(key, await toBuffer(value), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: options.httpMetadata?.contentType || 'application/octet-stream', ...(options.ttlDays ? { ttlDays: options.ttlDays } : {}) });
    },
    async get(key) {
      let found;
      try { found = await get(key, { access: 'private', useCache: false }); } catch (error) { if (error?.name === 'BlobNotFoundError') return null; throw error; }
      if (!found || found.statusCode !== 200 || !found.stream) return null;
      return { key, size: found.blob.size, body: found.stream };
    },
    async delete(key) { await del(key); }
  };
}

/** 내 컴퓨터에서 시험할 때만 쓰는 폴더 저장소 (AJ_LOCAL_BLOB_DIR). */
function folderBucket(folder) {
  const file = key => { const target = path.join(folder, key); if (!target.startsWith(path.resolve(folder) + path.sep)) throw new Error('invalid key'); return target; };
  return {
    async put(key, value) { const target = file(key); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, await toBuffer(value)); },
    async get(key) { try { const bytes = await readFile(file(key)); return { key, size: bytes.length, body: new Response(bytes).body }; } catch { return null; } },
    async delete(key) { await rm(file(key), { force: true }); }
  };
}

let bucket;
/** 설정이 없으면 null (PDF 기능만 '준비 중'으로 응답하고 나머지는 정상 동작). */
export function getBucket() {
  if (bucket === undefined) {
    if (process.env.AJ_LOCAL_BLOB_DIR) bucket = folderBucket(path.resolve(process.env.AJ_LOCAL_BLOB_DIR));
    else bucket = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID ? blobBucket() : null;
  }
  return bucket;
}
