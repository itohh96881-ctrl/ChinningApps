import { defineConfig } from 'vite';

export default defineConfig({
    // GitHub Pagesなどのサブディレクトリへのデプロイに対応するため
    // 相対パスを使用するように設定します。
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
});
