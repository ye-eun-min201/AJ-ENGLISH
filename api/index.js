// Vercel 함수 입구. /api/* 와 /auth/* 요청이 모두 여기로 들어온다 (vercel.json 의 rewrites 참고).
import { handle } from '../server/adapter.mjs';

export default {
  fetch(request) { return handle(request); }
};
