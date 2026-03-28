import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        services: resolve(__dirname, 'services.html'),
        it_services: resolve(__dirname, 'it-services.html'),
        digital_marketing: resolve(__dirname, 'digital-marketing.html'),
        hr_services: resolve(__dirname, 'hr-services.html'),
        training: resolve(__dirname, 'training.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
});
