import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'lookbook-ai',
  brand: {
    // 기존 웹(public/static/style.css --primary)과 동일한 브랜드 컬러
    primaryColor: '#3182F6',
  },
  webView: {},
  permissions: [],
  webBundleDir: 'dist',
});
