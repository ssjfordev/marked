import { chromium } from 'playwright';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

(async () => {
  // 임시 프로필로 실행 (기존 Chrome과 충돌 방지)
  const userDataDir = mkdtempSync(join(tmpdir(), 'marked-demo-'));
  console.log('프로필 경로:', userDataDir);

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: false,
    slowMo: 300,
    viewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || (await context.newPage());

  // 1. 대시보드로 이동
  await page.goto('https://marked-web-eight.vercel.app/dashboard');

  // 로그인 안 되어있으면 수동 로그인 대기
  const url = page.url();
  if (url.includes('auth') || url.includes('login') || !url.includes('dashboard')) {
    console.log('⏳ 로그인이 필요합니다. 브라우저에서 로그인해주세요...');
    await page.waitForURL('**/dashboard', { timeout: 120000 });
    console.log('✅ 로그인 완료! 3초 후 데모 시작...');
    await page.waitForTimeout(3000);
  } else {
    console.log('✅ 이미 로그인됨. 2초 후 데모 시작...');
    await page.waitForTimeout(2000);
  }

  // 2. 대시보드 로딩 대기
  console.log('📁 대시보드 로딩 대기...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 3. 폴더 클릭 (부분 텍스트 매칭)
  console.log('📁 폴더 이동...');
  const importFolder = page.locator('text=/imported/i').first();
  await importFolder.waitFor({ state: 'visible', timeout: 10000 });
  await importFolder.click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');

  // 4. 현재 화면 디버그 스크린샷
  await page.screenshot({ path: '/tmp/marked-demo-debug.png' });
  console.log('📸 스크린샷 저장: /tmp/marked-demo-debug.png');

  // 현재 URL 확인
  console.log('현재 URL:', page.url());

  // 화면에 보이는 텍스트 확인
  const visibleTexts = await page.locator('main *').allTextContents();
  console.log('화면 텍스트 (처음 20개):', visibleTexts.slice(0, 20));

  console.log('🎬 디버그 완료!');
  await page.waitForTimeout(3000);
  await context.close();
})();
