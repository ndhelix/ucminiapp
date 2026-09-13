/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS test runner with a configurable Playwright location. */
/* Runs against the local Vite preview with a mocked Telegram bridge and CRM API.
   PLAYWRIGHT_MODULE can point to an existing Playwright installation. No production requests are allowed. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

async function main() {
  const server = spawn(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4179', '--strictPort'], { stdio: 'pipe' });
  let browser, page;
  try {
    await new Promise((resolve, reject) => { server.stdout.on('data', d => { if (String(d).includes('4179')) resolve(); }); server.on('error', reject); server.on('exit', code => reject(Error(`Preview exited: ${code}`))); setTimeout(() => reject(Error('Preview timeout')), 10000).unref(); });
    browser = await chromium.launch({ headless: true, channel: process.platform === 'win32' ? 'msedge' : undefined });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await context.addInitScript(() => { window.TelegramWebviewProxy = { postEvent(name) {
      if (name === 'web_app_request_viewport') setTimeout(() => window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ eventType: 'viewport_changed', eventData: { height: 844, is_state_stable: true, is_expanded: true } }) })), 0);
    } }; });
    let permissions = { Notifications: true, Missions: true, EditMissions: true, Payments: true, Clients: true, EditClients: true, Events: true, EditEvents: true, Reports: true, Finance: true, Messages: true, AssignClients: false, IsAdmin: true };
    const client = { Id: 71, Name: 'Тестовый клиент', Firstname: 'Тестовый', Lastname: 'клиент', Patronymic: '', Phone: '+79990000000', Email: '', Telegram: '', TelegramId: 123456, ManagerId: 12, AdsourceId: 0, ClientTypeId: 2, Comments: 'Комментарий', Created: '2026-09-11T10:00:00', SubscribedTill: null, RttmBotActive: true, AshfxproBotActive: false, Revision: 'client-v1' };
    const event = { Id: 91, ClientId: 71, ManagerId: 12, CreatorId: 12, EventTypeId: 5, EventStatusId: 1, ServiceId: null, Planned: '2026-09-11T11:00:00', ExpiryDate: null, Comments: 'Счёт', IncomeRub: 100, DurationMin: 30, Revision: 'event-v1' };
    const mission = { Id: 101, Name: 'Проверить оплату', Descr: 'Описание задачи', ManagerId: 12, CreatorId: 12, StatusId: 1, TypeId: 1, Priority: 1, Closed: false, Planned: '2026-10-01T00:00:00', Created: '2026-09-11T12:00:00', Revision: 'mission-v1' };
    const comments = [], dialog = [{ Key: 'in:1', Created: '2026-09-11T12:00:00', Text: 'Здравствуйте', Outgoing: false, Status: 'Получено' }];
    let chartData = {
      Labels: Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(2, '0') + '.09.2026'),
      Series: ['Highleveltrade', 'Venividivici', 'RocketToTheMoon', 'Crypto'].flatMap((Channel, c) => [false, true].map(Dashed => ({ Name: Channel + (Dashed ? ' — отписки' : ' — подписки'), Channel, Dashed, Values: Array.from({ length: 14 }, (_, i) => (Dashed ? 8 : 40) + c * 14 + (i * (c + 2) * 13 % 65)) })))
    };
    let unread = 1;
    const saves = [], external = [], errors = [];
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') return route.continue();
      if (url.hostname !== 'unit-control.ru' || !url.pathname.startsWith('/MiniApp/')) { external.push(url.href); return route.abort(); }
      assert.ok(route.request().headers()['x-telegram-init-data']);
      const action = url.pathname.split('/').pop();
      const body = action === 'AddMissionComment' ? { Multipart: route.request().postData() } : route.request().postDataJSON();
      let data;
      switch (action) {
        case 'Me': data = { ManagerId: 12, CompanyId: 8, Name: 'Тестовый менеджер', Permissions: permissions }; break;
        case 'Lookups': data = { Managers: [{ Id: 12, Name: 'Тестовый менеджер', Active: true }], Adsources: [], EventTypes: [{ Id: 5, Name: 'Счёт' }], EventStatuses: [{ Id: 1, Name: 'Не выполнено' }, { Id: 3, Name: 'Выполнено' }], Services: [] }; break;
        case 'Calendar': data = { datepickfrom: body.datepickfrom || '2026-09-01T00:00:00', Slots: [{ Id: 91, Kind: 'event', Start: event.Planned, Title: 'Календарное событие', Description: '' }] }; break;
        case 'Clients': data = { Page: 1, Total: 1, Items: [client] }; break;
        case 'ClientDetails': data = { Item: client, CanEdit: true, Channels: [{ Id: 1, Name: 'Moon' }] }; break;
        case 'ClientBilling': data = { Balance: 500, InquiryBalance: 4, Subscriptions: [], Payments: [], Operations: [] }; break;
        case 'Events': data = { Page: 1, Total: 1, Items: [{ Event: event, ClientName: client.Name }] }; break;
        case 'EventDetails': data = { Item: event, ClientName: client.Name, CanAssign: true, CanChangeStatus: true }; break;
        case 'SaveClient': saves.push({ action, body }); Object.assign(client, body, { Id: 71 }); client.Name = `${body.Firstname} ${body.Lastname}`; data = { Id: 71 }; break;
        case 'SaveEvent': saves.push({ action, body }); Object.assign(event, body, { Id: 91 }); data = { Id: 91 }; break;
        case 'MissionLookups': data = { Statuses: [{ Id: 1, Name: 'Открыта' }, { Id: 3, Name: 'Готово' }], Types: [{ Id: 1, Name: 'Общая' }] }; break;
        case 'Missions': data = { Page: body.Page || 1, Total: 1, Items: [mission] }; break;
        case 'MissionDetails': data = { Item: mission, Comments: comments }; break;
        case 'SaveMission': saves.push({ action, body }); Object.assign(mission, body, { Id: 101 }); data = { Id: 101 }; break;
        case 'AddMissionComment': saves.push({ action, body }); comments.push({ Id: 1, Descr: 'Комментарий теста', ManagerName: 'Тестовый менеджер', Created: '2026-09-11T12:00:00', FileName: 'test.txt' }); data = { Id: 1 }; break;
        case 'MissionAttachment': return route.fulfill({ body: 'test attachment', contentType: 'application/octet-stream', headers: { 'Access-Control-Allow-Origin': '*' } });
        case 'ClientDialog': data = { Page: 1, Total: dialog.length, CanSend: permissions.Messages, Items: dialog }; break;
        case 'SendClientMessage': saves.push({ action, body }); dialog.unshift({ Key: 'out:2', Created: '2026-09-11T12:01:00', Text: body.Text, Outgoing: true, Status: 'В очереди' }); data = { Id: 2 }; break;
        case 'Notifications': data = { Page: 1, Total: 1, Unread: unread, Through: '2026-09-11T12:00:00', Items: [{ Id: 1, ClientId: 71, ClientName: client.Name, ChatId: 123456, Message: 'Новое уведомление', Created: '2026-09-11T12:00:00', Unread: !!unread }] }; break;
        case 'ReadNotifications': saves.push({ action, body }); unread = 0; data = {}; break;
        case 'Payments': saves.push({ action, body }); data = { Page: 1, Total: 1, Totals: { Income: 2000, Refunds: 0 }, Items: [{ Id: 1, Kind: 'payment', ClientId: 71, ClientName: '', TelegramId: 123456, Created: '2026-09-11T12:00:00', Rub: 2000, Tokens: 2000, Status: 'succeeded', Description: 'Покупка токенов', ExternalId: 'test-payment', PaidAt: '2026-09-11T12:00:00' }] }; break;
        case 'SubscriberDynamics': data = chartData; break;
        case 'SubscribersTransferReport': data = { Items: [{ Channel: 'Moon', Link: '[PUBLIC]', LinkName: 'Публичная', SubscriberCount: 10, ClientCount: 2, TransferPercent: 20, LeftCount: 1, IncomeRub: 100 }] }; break;
        case 'AdsourceStats': data = { Items: [{ Name: 'Реклама', Count: 12 }] }; break;
        case 'BotStats': data = { BotStarts: 100, BuyersCount: 10, IncomeSumRub: 2000 }; break;
        default: throw Error(`Unexpected endpoint ${action}`);
      }
      await route.fulfill({ json: { Success: true, ...data }, headers: { 'Access-Control-Allow-Origin': '*' } });
    });
    page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', e => errors.push(e.message));
    const launch = new URLSearchParams({ tgWebAppPlatform: 'tdesktop', tgWebAppVersion: '8.0', tgWebAppThemeParams: JSON.stringify({ bg_color: '#ffffff', text_color: '#222222', button_color: '#2481cc', button_text_color: '#ffffff' }), tgWebAppData: new URLSearchParams({ user: JSON.stringify({ id: 123, first_name: 'Test' }), auth_date: String(Math.floor(Date.now() / 1000)), hash: 'test-only' }).toString() });
    await page.goto(`http://127.0.0.1:4179/ucminiapp/calendar?month=2026-09#${launch}`);
    await page.getByRole('link', { name: 'Календарное событие', exact: true }).click();
    await page.getByRole('heading', { name: 'Событие №91' }).waitFor();
    await page.goBack(); assert.ok(page.url().includes('month=2026-09'));
    await page.getByRole('link', { name: 'Клиенты', exact: true }).click();
    await page.getByLabel('Поиск', { exact: true }).fill('Тестовый'); await page.getByRole('button', { name: 'Найти', exact: true }).click();
    await page.locator('.record-card').first().click();
    await page.getByText('500 токенов', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Изменить', exact: true }).click();
    await page.getByLabel('Имя', { exact: true }).fill('Изменённый');
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await page.getByText('Изменения сохранены.').waitFor(); assert.equal(saves[0].body.Revision, 'client-v1');
    await page.getByRole('link', { name: 'Добавить', exact: true }).click();
    await page.getByLabel('Тип события').selectOption('5');
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await page.getByRole('heading', { name: 'Событие №91' }).waitFor();
    assert.equal(saves[1].body.ClientId, 71); assert.ok(saves[1].body.RequestId);
    await page.getByRole('button', { name: 'Изменить', exact: true }).click();
    await page.getByLabel('Статус').selectOption('3');
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await page.getByText('Событие сохранено.').waitFor(); assert.equal(saves[2].body.EventStatusId, 3);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.screenshot({ path: 'tests/workspace-mobile.png', fullPage: true });
    await page.getByRole('link', { name: 'Клиенты', exact: true }).click();
    await page.getByRole('link', { name: 'Создать', exact: true }).click();
    await page.getByLabel('Имя', { exact: true }).fill('Новый клиент');
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await page.getByText('500 токенов', { exact: true }).waitFor();
    assert.equal(saves[3].body.Id, 0); assert.ok(saves[3].body.RequestId); assert.equal(saves[3].body.ManagerId, 12);
    // Stages 4-6: all mutations use mocked endpoints, never production.
    await page.getByRole('link', { name: 'Задачи', exact: true }).click();
    await page.getByRole('link', { name: 'Создать', exact: true }).click();
    await page.getByLabel('Название', { exact: true }).fill('Новая задача');
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await page.getByRole('heading', { name: 'Новая задача', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Изменить', exact: true }).click();
    await page.getByLabel('Статус').selectOption('3');
    await page.getByLabel('Закрыта', { exact: true }).check();
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await page.getByText('Готово · Закрыта', { exact: true }).waitFor();
    assert.ok(saves.find(x => x.action === 'SaveMission').body.RequestId);
    await page.getByLabel('Новый комментарий', { exact: true }).fill('Комментарий теста');
    await page.getByLabel('Вложение до 10 МБ').setInputFiles({ name: 'test.txt', mimeType: 'text/plain', buffer: Buffer.from('test attachment') });
    await page.getByRole('button', { name: 'Добавить комментарий', exact: true }).click();
    await page.getByText('Комментарий теста', { exact: true }).waitFor();
    assert.match(saves.find(x => x.action === 'AddMissionComment').body.Multipart, /RequestId/);
    const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Скачать test.txt' }).click(); await downloadPromise;
    client.ClientTypeId = 2; client.TelegramId = 123456; client.RttmBotActive = true;
    await page.goto('http://127.0.0.1:4179/ucminiapp/clients/71#' + launch);
    await page.getByRole('button', { name: /Переписка с клиентом/ }).click();
    await page.getByText('Здравствуйте', { exact: true }).waitFor();
    await page.getByLabel('Сообщение', { exact: true }).fill('Сообщение из Mini App');
    await page.getByRole('button', { name: 'Отправить', exact: true }).click();
    await page.getByText('Сообщение поставлено в очередь отправки.').waitFor();
    assert.equal(saves.find(x => x.action === 'SendClientMessage').body.Bot, 'RTTM');
    assert.ok(saves.find(x => x.action === 'SendClientMessage').body.RequestId);
    await page.getByRole('link', { name: 'Ещё', exact: true }).click();
    await page.getByRole('link', { name: 'Уведомления', exact: true }).click();
    await page.getByRole('button', { name: 'Прочитано до последнего сообщения' }).click();
    await page.getByText('Непрочитанных: 0').waitFor();
    await page.getByRole('link', { name: 'Ещё', exact: true }).click();
    await page.getByRole('link', { name: 'Платежи от клиентов', exact: true }).click();
    await page.getByRole('link', { name: '123456', exact: true }).waitFor();
    await page.getByLabel('ID клиента').fill('71'); await page.getByRole('button', { name: 'Применить', exact: true }).click();
    await page.waitForURL(/client=71/); await page.getByText('YooKassa: test-payment').waitFor();
    assert.equal(saves.filter(x => x.action === 'Payments').pop().body.ClientId, 71);
    await page.getByRole('link', { name: 'Ещё', exact: true }).click();
    await page.getByRole('link', { name: 'Подписчики и аналитика', exact: true }).click();
    await page.locator('svg polyline').first().waitFor(); assert.equal(await page.locator('svg polyline').count(), 8); assert.equal(await page.locator('svg polyline[stroke-dasharray]').count(), 4);
    const plot = page.locator('.chart-plot'), tooltip = page.getByRole('tooltip');
    await plot.hover({ position: { x: 54, y: 100 } });
    await tooltip.getByText('01.09.2026', { exact: true }).waitFor();
    assert.equal(await tooltip.locator('.chart-tooltip__row').count(), 8);
    for (const series of chartData.Series) {
      const row = tooltip.locator('.chart-tooltip__row').filter({ hasText: series.Name });
      assert.equal(await row.locator('b').innerText(), String(series.Values[0]));
    }
    await page.getByRole('button', { name: 'Crypto — отписки', exact: true }).click();
    assert.equal(await page.locator('svg polyline').count(), 7);
    assert.equal(await tooltip.locator('.chart-tooltip__row').count(), 7);
    assert.equal(await page.getByRole('button', { name: 'Crypto — отписки', exact: true }).getAttribute('aria-pressed'), 'false');
    await page.getByRole('button', { name: 'Скрыть все', exact: true }).click();
    assert.equal(await page.locator('svg polyline').count(), 0);
    await page.getByText(/Все линии скрыты/).waitFor();
    assert.equal(await tooltip.count(), 0);
    await page.getByRole('button', { name: 'Показать все', exact: true }).click();
    assert.equal(await page.locator('svg polyline').count(), 8);
    await plot.focus(); await plot.press('End');
    await tooltip.getByText('14.09.2026', { exact: true }).waitFor();
    assert.equal(await tooltip.locator('.chart-tooltip__row').first().locator('b').innerText(), String(chartData.Series[0].Values[13]));
    await plot.press('Escape'); assert.equal(await tooltip.count(), 0);
    await plot.scrollIntoViewIfNeeded();
    let chartBox = await plot.boundingBox();
    await page.touchscreen.tap(chartBox.x + 54, chartBox.y + 100);
    await tooltip.getByText('01.09.2026', { exact: true }).waitFor();
    assert.equal(await page.locator('.chart-tooltip--floating').count(), 0);
    await page.setViewportSize({ width: 390, height: 1400 });
    await page.locator('.subscriber-chart').screenshot({ path: 'tests/chart-mobile.png' });
    await page.setViewportSize({ width: 320, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Chart width 320');
    await page.setViewportSize({ width: 1200, height: 1000 });
    await plot.hover({ position: { x: 200, y: 120 } });
    await page.locator('.chart-tooltip--floating').waitFor();
    chartBox = await page.locator('.chart-frame').boundingBox();
    const tipBox = await tooltip.boundingBox();
    assert.ok(tipBox.x >= chartBox.x && tipBox.x + tipBox.width <= chartBox.x + chartBox.width, 'Tooltip stays inside chart');
    await page.locator('.subscriber-chart').screenshot({ path: 'tests/chart-desktop.png' });
    await page.mouse.move(0, 0); await tooltip.waitFor({ state: 'hidden' });
    await page.setViewportSize({ width: 390, height: 844 });
    chartData = { Labels: ['01.09.2026'], Series: chartData.Series.map(s => ({ ...s, Values: [0] })) };
    await page.getByRole('button', { name: 'Показать', exact: true }).click();
    await plot.waitFor(); await plot.focus(); await plot.press('Home');
    await tooltip.getByText('01.09.2026', { exact: true }).waitFor();
    assert.equal(await tooltip.locator('.chart-tooltip__row').first().locator('b').innerText(), '0');
    assert.equal(await page.locator('svg polyline').count(), 8);
    chartData = { Labels: [], Series: [] };
    await page.getByRole('button', { name: 'Показать', exact: true }).click();
    await page.getByText('Нет данных за выбранный период.', { exact: true }).waitFor();

    await page.getByLabel('Отчёт').selectOption('transfers'); await page.getByRole('button', { name: 'Показать', exact: true }).click(); await page.getByText('Клиентов: 2 · Переход: 20%').waitFor();
    await page.getByLabel('Отчёт').selectOption('adsources'); await page.getByRole('button', { name: 'Показать', exact: true }).click(); await page.getByText('Новых клиентов: 12').waitFor();
    await page.getByLabel('Отчёт').selectOption('bot'); await page.getByRole('button', { name: 'Показать', exact: true }).click(); await page.getByText('Покупателей: 10').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.goto('http://127.0.0.1:4179/ucminiapp/clients/71#' + launch);
    permissions = { ...permissions, EditClients: false, EditEvents: false, EditMissions: false, Messages: false, Payments: false, Finance: false, Reports: false };
    await page.reload(); await page.getByRole('heading', { name: /Новый клиент/ }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Изменить', exact: true }).count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Отчёты', exact: true }).count(), 0);
    await page.goto('http://127.0.0.1:4179/ucminiapp/payments#' + launch);
    await page.getByText('Этот раздел недоступен по вашей должности.').waitFor();
    assert.deepEqual(external, []); assert.deepEqual(errors, []);
    console.log('PASS: calendar navigation, client creation/edit, event creation/completion, tasks/comments/attachments, dialogs, notifications, payments, analytics, mobile width, read-only permissions; all CRM requests mocked.');
  }
  catch (e) { if (page) { console.error(await page.locator('body').innerText()); await page.screenshot({ path: 'tests/workspace-failure.png', fullPage: true }); } throw e; }
  finally { if (browser) await browser.close(); server.kill(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
