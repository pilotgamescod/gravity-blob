const { chromium } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = '/tmp/gravity-blob-preview';
const server = http.createServer((req,res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.png') ? 'image/png' : 'text/html');
  fs.createReadStream(file).on('error', () => {res.statusCode=404;res.end();}).pipe(res);
});
(async () => {
 await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
 const browser = await chromium.launch({channel:'chrome', headless:true});
 try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByText('GIOCA',{exact:true}).waitFor();
  await page.screenshot({path:'/tmp/gravity-menu.png'});
  const play = await page.getByText('GIOCA',{exact:true}).boundingBox();
  await page.touchscreen.tap(play.x + play.width / 2, play.y + play.height / 2);
  await page.getByText('PUNTI',{exact:true}).waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({path:'/tmp/gravity-playing.png'});
  await page.touchscreen.tap(190,400);
  // Wait for the actual physics loop to reach the death screen, then exercise both exits.
  await page.getByText('RIPROVA',{exact:true}).waitFor({timeout:30000});
  await page.screenshot({path:'/tmp/gravity-gameover.png'});
  await page.getByText('RIPROVA',{exact:true}).click();
  await page.getByText('PUNTI',{exact:true}).waitFor();
  await page.touchscreen.tap(190,400);
  await page.getByText('RIPROVA',{exact:true}).waitFor({timeout:30000});
  await page.getByText('MENU PRINCIPALE',{exact:true}).click();
  await page.getByText('GIOCA',{exact:true}).waitFor();
  // Test-only inspection of React hooks: arrange unlocked worlds and deterministic hazards.
  // No debug routes or cheats are shipped in the game.
  await page.evaluate(() => {
    window.testHooks = () => {
      for (const node of document.querySelectorAll('div')) {
        const key = Object.keys(node).find(k => k.startsWith('__reactFiber$'));
        for (let fiber = node[key]; fiber; fiber = fiber.return) {
          const hooks = [];
          for (let h = fiber.memoizedState; h && 'memoizedState' in h; h = h.next) hooks.push(h);
          const game = hooks.find(h => h.memoizedState?.current?.platforms && h.memoizedState.current.world);
          if (game) return { game: game.memoizedState.current, scores: hooks.find(h => h.memoizedState && 'nebulosa' in Object(h.memoizedState)) };
        }
      }
      throw new Error('Game hooks not found');
    };
    window.testHooks().scores.queue.dispatch({nebulosa:1000,asteroidi:1000,buconero:1000,supernova:0});
  });
  await page.getByText('›',{exact:true}).click();
  const playWorld = async () => {
    const box = await page.getByText('GIOCA',{exact:true}).boundingBox();
    await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
    await page.getByText('PUNTI',{exact:true}).waitFor();
  };
  await playWorld();
  await page.evaluate(() => {
    const g = window.testHooks().game;
    g.platforms = ['moving','soft','boost','sweep'].map((type,i) => ({id:9000+i,x:i%2 ? 210:30,y:230+i*95,baseY:230+i*95,w:120,type,amplitude:type==='moving'?20:0,phase:0,colorIdx:1}));
    g.playerY=100;g.velY=0;
  });
  await page.waitForTimeout(100);
  await page.screenshot({path:'/tmp/gravity-asteroids.png'});
  const down = await page.evaluate(() => window.testHooks().game.gravityDown);
  const sweepBox=await page.getByRole('button',{name:'Spazza via la piattaforma'}).first().boundingBox();
  await page.touchscreen.tap(sweepBox.x+sweepBox.width/2,sweepBox.y+sweepBox.height/2);
  assert.equal(await page.evaluate(() => window.testHooks().game.platforms.some(p=>p.id===9003)),false);
  assert.equal(await page.evaluate(() => window.testHooks().game.gravityDown),down);
  await page.evaluate(() => {window.testHooks().game.playerY=1000;});
  await page.getByText('MENU PRINCIPALE',{exact:true}).click();
  await page.getByText('›',{exact:true}).click();
  await playWorld();
  await page.evaluate(() => {
    const g=window.testHooks().game;
    g.totalScroll=800;
    g.meteors=[{id:999,born:g.elapsed,startX:440,startY:320,vx:-240,vy:10,radius:18}];
  });
  await page.waitForTimeout(100);
  await page.getByText('METEORA IN ARRIVO',{exact:true}).waitFor();
  await page.screenshot({path:'/tmp/gravity-blackhole.png'});
  await page.evaluate(() => {
    const g=window.testHooks().game;
    g.meteors=[{id:1000,born:g.elapsed-1.25,startX:390*.22+32,startY:g.playerY+32,vx:-20,vy:0,radius:18}];
  });
  await page.getByText('RIPROVA',{exact:true}).waitFor();
  await page.getByText('RIPROVA',{exact:true}).click();
  await page.getByText('PUNTI',{exact:true}).waitFor();
  assert.equal(await page.evaluate(() => window.testHooks().game.meteors.length),0);
  assert.deepEqual(errors,[]);
  console.log('Browser OK: menu, avvio, morte, riprova e ritorno al menu; piattaforme eliminabili senza inversione, morte da meteora e reset; nessun errore JS.');
 } finally { await browser.close();server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
