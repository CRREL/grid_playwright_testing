import { test } from '@fixtures';
import { useDefaultAoi, downloadTile, testMapTableSort } from '@aois';
import { navigateToMap } from '@before-test';
import { exportFileType } from '@exports';
import { enableDataLayer } from '@layers';

test.beforeEach(async ({ page, context }) => {
  await navigateToMap(page, context);
  await enableDataLayer(page, "features");
  await useDefaultAoi(page);
});

test.describe('export features', () => {
  test('features map table sort', async ({ page }) => {
    await testMapTableSort(page);
  });

  test('features export GeoPackage', async ({ page }) => {
    await exportFileType(page, 'GeoPackage');
  });

  test('features export GML', async ({ page }) => {
    await exportFileType(page, 'GML');
  });

  test('features export SQLite', async ({ page }) => {
    await exportFileType(page, 'SQLite');
  });

  test('features export ESRI Shapefile', async ({ page }) => {
    await exportFileType(page, 'ESRI Shapefile');
  });

  test('features export KMZ', async ({ page }) => {
    await exportFileType(page, 'KMZ');
  });

  test('features export flatgeobuf', async ({ page }) => {
    await exportFileType(page, 'flatgeobuf');
  });

  test('features export GeoParquet', async ({ page }) => {
    await exportFileType(page, 'GeoParquet');
  });

  test('features export GeoJSON', async ({ page }) => {
    await exportFileType(page, 'GeoJSON');
  });

  test('features download tile', async ({ page }) => {
    await downloadTile(page);
  });
});