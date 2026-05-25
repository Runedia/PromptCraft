// PromptCraft 2.5 — HTML 슬라이드 → PPTX 변환 (스크린샷 기반)
// make-slide PPTX 워크플로우: Playwright 스크린샷 → PptxGenJS 16:9 full-slide 이미지
// 주석처리(<!-- -->)된 요소는 렌더되지 않으므로 PPTX에도 미포함.
const { chromium } = require('playwright');
const PptxGenJS = require('pptxgenjs');

const HTML = 'file:///E:/Project/PromptCraft/docs/presentation/promptcraft-2.5.html';
const OUT = 'E:/Project/PromptCraft/docs/presentation/promptcraft-2.5.pptx';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  await page.goto(HTML, { waitUntil: 'networkidle' });

  // 애니메이션 무력화 + .a 강제 가시화 + 네비게이션 UI 숨김
  await page.addStyleTag({
    content: `
      *, *::before, *::after { animation: none !important; transition: none !important; animation-delay: 0s !important; }
      .slide.active .a, .a { opacity: 1 !important; transform: none !important; }
      .progress-bar, .slide-counter, .hint, .fullscreen-btn, .notes-panel { display: none !important; }
    `,
  });
  await page.evaluate(() => document.fonts.ready);

  const total = await page.evaluate(() => document.querySelectorAll('.slide').length);

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'W16x9', width: 13.333, height: 7.5 });
  pptx.layout = 'W16x9';
  pptx.author = 'PromptCraft';
  pptx.title = 'PromptCraft 2.5';

  for (let i = 0; i < total; i++) {
    await page.evaluate((idx) => {
      document.querySelectorAll('.slide').forEach((s, j) => {
        s.style.display = j === idx ? 'flex' : 'none';
        s.style.opacity = j === idx ? '1' : '0';
        s.classList.toggle('active', j === idx);
      });
    }, i);
    await page.waitForTimeout(450); // 레이아웃 안정화
    const buf = await page.screenshot({ type: 'png' });
    const slide = pptx.addSlide();
    slide.addImage({ data: 'data:image/png;base64,' + buf.toString('base64'), x: 0, y: 0, w: '100%', h: '100%' });
  }

  await pptx.writeFile({ fileName: OUT });
  await browser.close();
  console.log('PPTX written:', OUT, '| slides:', total);
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
