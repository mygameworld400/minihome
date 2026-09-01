import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 프로젝트 사이트는 /<저장소명>/ 하위 경로로 서빙된다.
// 라우팅은 HashRouter를 쓰므로 404.html 우회가 필요 없다.
export default defineConfig({
  base: '/minihome/',
  plugins: [react()],
})
