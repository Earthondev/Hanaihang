import { test as base } from '@playwright/test';

export const test = base.extend<{
  withGeo: void;
}>({
  // ฟิกซ์เจอร์เปิดสิทธิ์ geolocation + mock ตำแหน่ง (กรุงเทพ)
  withGeo: [
    async ({ context }, use) => {
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 13.7466, longitude: 100.5347 });
      await use();
    },
    { auto: false },
  ],
});

export const expect = test.expect;
