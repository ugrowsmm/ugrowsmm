/**
 * UGrowSMM backend (Google Apps Script web app). Deploy: Execute as ME, access ANYONE.
 * Script Properties (Project Settings): PROVIDER_API_URL, PROVIDER_API_KEY, ADMIN_TOKEN,
 * PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX, TURNSTILE_SECRET. Never commit real values.
 * Script Property BONUS_SERVICE_ID = provider service id for Instagram views.
 */
const P = PropertiesService.getScriptProperties();
const ss = () => SpreadsheetApp.getActive();
const MARKUP = 4;

function doPost(e) {
  const b = JSON.parse(e.postData.contents || '{}');
  const routes = { collectRequest, claimBonus, adminDeleteUser, adminAddReferral, logLogin, createPayment, checkPayment, placeOrder, requestWithdraw,
    adminSetCashback, adminAddFunds, adminOverview, createTicket, myTickets, adminSetTicketStatus, adminSetOrderStatus, adminSetWithdrawalStatus,
    signup, verifyEmail, resendOtp, login, forgotPassword, resetPassword, me, logout, account, adminSyncServices };
  const gate = guard(b);
  if (gate) return out({ error: gate });
  if (USER_ACTIONS[b.action]) { if (!sessionOk(b)) return out({ error: 'auth' }); b.email = canon(b.email); }
  try { return out(routes[b.action] ? routes[b.action](b) : { error: 'unknown action' }); }
  catch (err) { return out({ error: String(err) }); }
}
// ---- Bot protection: honeypot, per-user rate limit, Cloudflare Turnstile (set TURNSTILE_SECRET) ----
const USER_ACTIONS = { account: 1, logLogin: 1, collectRequest: 1, claimBonus: 1, createPayment: 1, checkPayment: 1, placeOrder: 1, requestWithdraw: 1, createTicket: 1, myTickets: 1 };
const PROTECTED = { signup: 1, login: 1, verifyEmail: 1, resendOtp: 1, forgotPassword: 1, resetPassword: 1, logLogin: 1, createPayment: 1, collectRequest: 1, requestWithdraw: 1, placeOrder: 1, claimBonus: 1, createTicket: 1, myTickets: 1 };
function guard(b) {
  const isAdminCall = String(b.action || '').indexOf('admin') === 0;
  if (!PROTECTED[b.action] && !isAdminCall) return '';
  if (b.hp) return 'bot';
  const cache = CacheService.getScriptCache();
  const who = isAdminCall ? 'admin' : String(b.email || '').toLowerCase();
  const key = 'rl:' + (isAdminCall ? 'admin' : b.action) + ':' + who;
  const n = Number(cache.get(key) || 0);
  if (n >= (isAdminCall ? 30 : 10)) return 'rate_limited';
  cache.put(key, String(n + 1), 60);
  if (isAdminCall || !P.getProperty('TURNSTILE_SECRET')) return '';
  if (cache.get('pass:' + who)) return '';
  if (!b.captcha) return 'captcha_required';
  const res = JSON.parse(UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'post', muteHttpExceptions: true, payload: { secret: P.getProperty('TURNSTILE_SECRET'), response: b.captcha } }).getContentText());
  if (!res.success) return 'captcha_failed';
  cache.put('pass:' + who, '1', 21600);
  return '';
}
const out = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const sheet = (n) => ss().getSheetByName(n) || ss().insertSheet(n);
const isAdmin = (b) => b.adminToken && b.adminToken === P.getProperty('ADMIN_TOKEN');

function logLogin(b) { return { ok: true }; } // logins are recorded by login()
// ---- PhonePe: fixed-amount QR + automatic status check (fill with your Business API details) ----
function createPayment(b) {
  // Safety: do not take real money until automatic payment confirmation (checkPayment below) is wired to your payment gateway.
  // When it is, set Script Property PAYMENT_ENABLED = 1.
  if (P.getProperty('PAYMENT_ENABLED') !== '1') return { error: 'payments_disabled' };
  const amount = Number(b.amount); if (!(amount >= 10)) return { error: 'min amount 10' };
  const txn = 'UG' + Date.now();
  // TODO: call PhonePe Business pay API with PHONEPE_* props, get dynamic QR / intent string.
  const qrData = 'upi://pay?pa=PLACEHOLDER@ybl&pn=UGrowSMM&am=' + amount + '&tn=' + txn;
  sheet('Payments').appendRow([txn, b.email, amount, 'PENDING', new Date()]);
  return { txn, qrData, amount };
}
function checkPayment(b) {
  const sh = sheet('Payments'), rows = sh.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) if (rows[i][0] === b.txn) {
    if (rows[i][3] === 'PAID') return { status: 'PAID' };
    // TODO: query PhonePe status API here; on success:
    const paid = false;
    if (paid) { sh.getRange(i + 1, 4).setValue('PAID'); credit(rows[i][1], rows[i][2], 'paid', 'Wallet top-up', 'deposit'); referralReward(rows[i][1], rows[i][2]); grantBonus(rows[i][1], rows[i][2]); return { status: 'PAID' }; }
    return { status: 'PENDING' };
  }
  return { error: 'txn not found' };
}
// Sends a UPI collect request to the user's own UPI ID (their app shows a notification to approve).
// TODO: call your PSP / PhonePe Business collect API with b.vpa, b.amount, b.txn. Collect support depends on your PSP.
function collectRequest(b) {
  if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(b.vpa || '')) return { error: 'invalid vpa' };
  return { ok: true };
}
// ---- Wallet (server is the only source of truth). Ledger = [date, email, amount, kind, note, type]
//   kind: 'paid' (real money, spendable), 'unpaid' (admin demo credit, never reaches the provider), 'referral' (earnings, withdrawable only)
//   type: 'deposit' | 'order' | 'refund' | 'referral' (shown in the user's transaction list)
const round2 = (n) => Math.round(Number(n) * 100) / 100;
function credit(email, amt, kind, note, type) { sheet('Ledger').appendRow([new Date(), email, amt, kind, note, type || '']); }
function wallet(email) {
  let paid = 0, unpaid = 0, earned = 0;
  sheet('Ledger').getDataRange().getValues().forEach(r => {
    if (r[1] !== email) return; const a = Number(r[2]) || 0;
    if (r[3] === 'paid') paid += a; else if (r[3] === 'unpaid') unpaid += a; else if (r[3] === 'referral') earned += a;
  });
  return { paid: round2(paid), unpaid: round2(unpaid), earned: round2(earned) };
}

// ---- Services: the Services sheet (id, name, category, providerRate per 1000, min, max) is the price list. Fill it with syncServices(). ----
function syncServices() {
  const list = JSON.parse(UrlFetchApp.fetch(P.getProperty('PROVIDER_API_URL'), { method: 'post', payload: { key: P.getProperty('PROVIDER_API_KEY'), action: 'services' } }).getContentText());
  if (!Array.isArray(list)) throw new Error('Provider said: ' + JSON.stringify(list).slice(0, 200));
  const sh = sheet('Services'); sh.clear();
  if (list.length) sh.getRange(1, 1, list.length, 6).setValues(list.map(x => [String(x.service), String(x.name), String(x.category), Number(x.rate), Number(x.min), Number(x.max)]));
  return list.length;
}
function adminSyncServices(b) { if (!isAdmin(b)) return { error: 'forbidden' }; return { ok: true, count: syncServices() }; }
const platformOf = (t) => /insta/i.test(t) ? 'instagram' : /you ?tube/i.test(t) ? 'youtube' : /telegram/i.test(t) ? 'telegram'
  : /facebook|\bfb\b/i.test(t) ? 'facebook' : /twitter|\bx\b/i.test(t) ? 'x' : /spotify/i.test(t) ? 'spotify' : 'instagram';

// ---- Orders sheet = [id, email, serviceId, link, qty, price, status, date, name, platform, startCount, remains, mock, bonus, refunded] ----
function placeOrder(b) {
  const email = canon(b.email), qty = Math.floor(Number(b.quantity));
  let link = String(b.link || '').trim();
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(link.replace(/^https?:\/\//i, ''))) return { error: 'invalid_link' };
  if (!/^https?:\/\//i.test(link)) link = 'https://' + link;
  const row = b.serviceId ? findRow('Services', String(b.serviceId)) : 0;
  if (!row) return { error: 'service_unavailable' };
  const sv = sheet('Services').getRange(row, 1, 1, 6).getValues()[0];
  if (!(qty >= Number(sv[4]) && qty <= Number(sv[5]))) return { error: 'invalid_quantity' };
  const price = round2(Number(sv[3]) * MARKUP * qty / 1000); // priced here, never trusted from the browser
  if (!(price > 0)) return { error: 'service_unavailable' };
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const w = wallet(email), mock = w.unpaid >= price;
    if (!mock && w.paid < price) return { error: 'insufficient_balance' };
    let id;
    if (mock) id = 'DEMO-' + Date.now().toString(36).toUpperCase();
    else {
      const res = JSON.parse(UrlFetchApp.fetch(P.getProperty('PROVIDER_API_URL'), { method: 'post', muteHttpExceptions: true, payload: {
        key: P.getProperty('PROVIDER_API_KEY'), action: 'add', service: String(sv[0]), link: link, quantity: qty } }).getContentText());
      if (res.error || !res.order) return { error: 'provider_error' };
      id = String(res.order);
    }
    const name = String(sv[1]).slice(0, 80);
    credit(email, -price, mock ? 'unpaid' : 'paid', name + ' · ' + qty, 'order');
    sheet('Orders').appendRow([id, email, String(sv[0]), link, qty, price, mock ? 'Completed' : 'Pending', new Date(), name, platformOf(sv[2] + ' ' + sv[1]), 0, qty, mock ? 'TRUE' : '', '', '']);
    return { ok: true, id };
  } finally { lock.releaseLock(); }
}
const ORDER_STATES = { 'pending': 'Pending', 'in progress': 'In progress', 'processing': 'In progress', 'completed': 'Completed', 'partial': 'Partial', 'canceled': 'Canceled', 'cancelled': 'Canceled', 'refunded': 'Canceled', 'fail': 'Canceled', 'failed': 'Canceled' };
// Run on a time trigger (installTriggers): pulls live status from the provider and refunds canceled / partial orders once.
function syncOrderStatuses() {
  const sh = sheet('Orders'), rows = sh.getDataRange().getValues(), active = [];
  rows.forEach((r, i) => { if (r[12] !== 'TRUE' && /^\d+$/.test(String(r[0])) && ['Pending', 'In progress'].indexOf(String(r[6])) >= 0) active.push(i); });
  for (let c = 0; c < active.length; c += 100) {
    const chunk = active.slice(c, c + 100);
    const res = JSON.parse(UrlFetchApp.fetch(P.getProperty('PROVIDER_API_URL'), { method: 'post', muteHttpExceptions: true, payload: {
      key: P.getProperty('PROVIDER_API_KEY'), action: 'status', orders: chunk.map(i => String(rows[i][0])).join(',') } }).getContentText());
    chunk.forEach(i => {
      const r = rows[i], o = res[String(r[0])]; if (!o || o.error) return;
      const st = ORDER_STATES[String(o.status || '').toLowerCase()]; if (!st) return;
      const qty = Number(r[4]) || 0, remains = Math.max(0, Number(o.remains) || 0), n = i + 1;
      sh.getRange(n, 7).setValue(st); sh.getRange(n, 11, 1, 2).setValues([[Number(o.start_count) || 0, remains]]);
      if (!r[14] && (st === 'Canceled' || st === 'Partial')) {
        const back = st === 'Canceled' ? Number(r[5]) : round2(Number(r[5]) * remains / Math.max(qty, 1));
        if (back > 0) { credit(r[1], back, 'paid', 'Refund · ' + r[8], 'refund'); sh.getRange(n, 15).setValue('TRUE'); }
      }
    });
  }
}
function installTriggers() { // run once from the Apps Script editor
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'syncOrderStatuses') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncOrderStatuses').timeBased().everyMinutes(10).create();
}

// ---- Everything the dashboard shows for one user, straight from the sheets ----
function account(b) {
  const email = canon(b.email), w = wallet(email), iso = (d) => { try { return new Date(d).toISOString(); } catch (e) { return new Date().toISOString(); } };
  const orders = sheet('Orders').getDataRange().getValues().filter(r => r[1] === email).reverse().slice(0, 200).map(r => {
    const qty = Number(r[4]) || 0, st = ORDER_STATES[String(r[6]).toLowerCase()] || 'Pending', remains = r[11] === '' ? qty : Number(r[11]) || 0;
    const progress = st === 'Completed' ? 100 : st === 'Pending' ? 0 : qty ? Math.max(st === 'In progress' ? 3 : 0, Math.min(100, Math.round((qty - remains) / qty * 100))) : 0;
    return { id: String(r[0]), serviceId: String(r[2]), serviceName: String(r[8] || r[2]), platform: String(r[9] || 'instagram'), link: String(r[3]).replace(/^https?:\/\//i, '').replace(/\/$/, ''),
      quantity: qty, charge: Number(r[5]) || 0, startCount: Number(r[10]) || 0, status: st, progress, createdAt: iso(r[7]), mock: r[12] === 'TRUE' || undefined, bonus: r[13] === 'TRUE' || undefined };
  });
  const tx = sheet('Ledger').getDataRange().getValues().filter(r => r[1] === email && r[3] !== 'referral').reverse().slice(0, 100).map((r, i) => {
    const amt = Number(r[2]) || 0, type = r[5] || (amt < 0 ? 'order' : 'deposit');
    return { id: 'TX-' + (1000 + i), type: type === 'refund' ? 'refund' : type === 'order' ? 'order' : 'deposit', label: String(r[4] || (type === 'deposit' ? 'Wallet top-up' : 'Order')), amount: Math.abs(amt), createdAt: iso(r[0]), method: type === 'deposit' ? 'UPI' : undefined };
  });
  const wd = sheet('Withdrawals').getDataRange().getValues().map((r, i) => ({ r, i })).filter(x => x.r[1] === email).reverse().map(x => ({
    id: 'WD-' + x.i, amount: Number(x.r[2]) || 0, method: x.r[3] ? 'UPI' : 'Bank', details: String(x.r[3] || x.r[4] || ''),
    status: x.r[5] === 'PAID' ? 'Paid' : x.r[5] === 'REJECTED' ? 'Rejected' : 'Processing', createdAt: iso(x.r[0]) }));
  const withdrawn = round2(wd.filter(x => x.status !== 'Rejected').reduce((t, x) => t + x.amount, 0));
  const bonusRow = sheet('Bonus').getDataRange().getValues().find(r => r[0] === email);
  const prof = profileOf(email);
  return { balance: w.paid, unpaid: w.unpaid, referral: { earned: w.earned, withdrawn }, orders, transactions: tx, withdrawals: wd,
    bonus: bonusRow ? (bonusRow[1] === 'CLAIMED' ? 'claimed' : 'ready') : 'none', percent: pct(prof.code) };
}
// ---- Referral: default 10%, per-code override set by admin; withdraw only from referral earnings ----
function pct(code) { const r = sheet('Referrals').getDataRange().getValues().find(x => x[0] === code); return r ? Number(r[2]) : 10; }
function referralReward(email, amt) {
  const rows = sheet('Users').getDataRange().getValues();
  const u = rows.find(x => x[0] === email);
  const referrer = u && u[3] ? rows.find(x => x[2] === u[3]) : null; // u[3] is the referrer's CODE, credit goes to their email
  if (referrer && referrer[0] !== email) credit(referrer[0], round2(amt * pct(u[3]) / 100), 'referral', 'Referral from ' + email, 'referral');
}
function requestWithdraw(b) {
  const earned = sheet('Ledger').getDataRange().getValues().filter(r => r[1] === b.email && r[3] === 'referral').reduce((s, r) => s + Number(r[2]), 0);
  const done = sheet('Withdrawals').getDataRange().getValues().filter(r => r[1] === b.email && r[5] !== 'REJECTED').reduce((s, r) => s + Number(r[2]), 0);
  if (Number(b.amount) > earned - done) return { error: 'exceeds available referral funds' };
  sheet('Withdrawals').appendRow([new Date(), b.email, b.amount, b.upi || '', b.bank || '', 'PENDING']);
  return { ok: true, note: 'Withdrawal requested. Amount will reach you within 24 hours after approval.' };
}
// ---- Admin ----
function adminSetCashback(b) { if (!isAdmin(b)) return { error: 'forbidden' };
  const sh = sheet('Referrals'), rows = sh.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) if (rows[i][0] === b.code) { sh.getRange(i + 1, 3).setValue(Number(b.percent)); return { ok: true }; }
  sh.appendRow([b.code, '', Number(b.percent)]); return { ok: true }; }
function adminAddFunds(b) { if (!isAdmin(b)) return { error: 'forbidden' };
  credit(canon(b.email) || b.email, Number(b.amount), b.kind === 'unpaid' ? 'unpaid' : 'paid', 'Wallet top-up', 'deposit'); return { ok: true }; }
function adminOverview(b) { if (!isAdmin(b)) return { error: 'forbidden' };
  const g = (n) => sheet(n).getDataRange().getValues();
  // newest first for the admin lists; Withdrawals keep sheet order because actions address them by row number
  return { users: g('Users'), orders: g('Orders').reverse(), withdrawals: g('Withdrawals'), tickets: g('Tickets').reverse(), logins: g('Logins').slice(-50).reverse() }; }

// ---- Support tickets: Tickets sheet = [id, email, type, orderId, subject, message, status, createdAt, resolvedAt]. Resolved by admin after email follow-up. ----
function createTicket(b) {
  if (!b.id || !b.email) return { error: 'missing fields' };
  sheet('Tickets').appendRow([String(b.id), String(b.email).toLowerCase(), b.type || '', b.orderId || '', b.subject || '', b.message || '', 'Open', new Date(), '']);
  return { ok: true };
}
function myTickets(b) {
  const email = String(b.email || '').toLowerCase();
  const tickets = sheet('Tickets').getDataRange().getValues().filter(r => String(r[1]).toLowerCase() === email).map(r => ({
    id: String(r[0]), type: String(r[2]), orderId: String(r[3]), subject: String(r[4]), message: String(r[5]),
    status: String(r[6]).toLowerCase() === 'resolved' ? 'Resolved' : 'Open', createdAt: new Date(r[7]).toISOString(), resolvedAt: r[8] ? new Date(r[8]).toISOString() : undefined }));
  return { tickets };
}
function adminSetTicketStatus(b) { if (!isAdmin(b)) return { error: 'forbidden' };
  const sh = sheet('Tickets'), rows = sh.getDataRange().getValues(), st = b.status === 'Resolved' ? 'Resolved' : 'Open';
  for (let i = 0; i < rows.length; i++) if (String(rows[i][0]) === String(b.id)) {
    sh.getRange(i + 1, 7).setValue(st); sh.getRange(i + 1, 9).setValue(st === 'Resolved' ? new Date() : ''); return { ok: true };
  }
  return { error: 'ticket not found' }; }

// ---- Admin: manually fix an order whose automatic status is stuck. Canceled can refund the charge to the wallet (once). ----
function adminSetOrderStatus(b) { if (!isAdmin(b)) return { error: 'forbidden' };
  const allowed = ['Pending', 'In progress', 'Completed', 'Partial', 'Canceled'];
  if (allowed.indexOf(b.status) < 0) return { error: 'invalid status' };
  const sh = sheet('Orders'), rows = sh.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) if (String(rows[i][0]) === String(b.id)) {
    const was = String(rows[i][6]);
    if (b.status === 'Canceled' && b.refund && was !== 'Canceled' && !rows[i][14] && Number(rows[i][5]) > 0 && rows[i][12] !== 'TRUE') { credit(rows[i][1], Number(rows[i][5]), 'paid', 'Refund · ' + (rows[i][8] || b.id), 'refund'); sh.getRange(i + 1, 15).setValue('TRUE'); }
    sh.getRange(i + 1, 7).setValue(b.status);
    return { ok: true };
  }
  return { error: 'order not found' }; }

// ---- Admin: payout review. Withdrawals sheet = [date, email, amount, upi, bank, status]; PENDING -> PAID or REJECTED (rejected amounts are available again). ----
function adminSetWithdrawalStatus(b) { if (!isAdmin(b)) return { error: 'forbidden' };
  const st = { Paid: 'PAID', Rejected: 'REJECTED' }[b.status]; if (!st) return { error: 'invalid status' };
  const sh = sheet('Withdrawals'), rows = sh.getDataRange().getValues(), i = Number(b.row) - 1;
  if (!rows[i] || String(rows[i][1]).toLowerCase() !== String(b.email).toLowerCase()) return { error: 'payout not found' };
  sh.getRange(i + 1, 6).setValue(st); return { ok: true }; }

// ---- Welcome bonus: user joined with a referral code and made a first top-up of Rs.100+ => 50,000 free Instagram views ----
function grantBonus(email, amount) {
  const u = sheet('Users').getDataRange().getValues().find(x => x[0] === email);
  const had = sheet('Bonus').getDataRange().getValues().some(r => r[0] === email);
  if (u && u[3] && !had && Number(amount) >= 100) sheet('Bonus').appendRow([email, 'READY', new Date()]);
}
function claimBonus(b) {
  const sh = sheet('Bonus'), rows = sh.getDataRange().getValues();
  for (let i = 0; i < rows.length; i++) if (rows[i][0] === b.email && rows[i][1] === 'READY') {
    const res = JSON.parse(UrlFetchApp.fetch(P.getProperty('PROVIDER_API_URL'), { method: 'post', payload: {
      key: P.getProperty('PROVIDER_API_KEY'), action: 'add', service: P.getProperty('BONUS_SERVICE_ID'), link: b.link, quantity: 50000 } }).getContentText());
    if (res.error) return { error: res.error };
    sh.getRange(i + 1, 2).setValue('CLAIMED');
    sheet('Orders').appendRow([String(res.order), b.email, 'BONUS', b.link, 50000, 0, 'Pending', new Date(), 'Instagram Views 50,000 (Free bonus)', 'instagram', 0, 50000, '', 'TRUE', '']);
    return { ok: true, order: res.order };
  }
  return { error: 'no bonus available' };
}
// ---- Admin: delete user / add referral funds ----
function adminDeleteUser(b) {
  if (!isAdmin(b)) return { error: 'forbidden' };
  const sh = sheet('Users'), rows = sh.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 0; i--) if (rows[i][0] === b.email) sh.deleteRow(i + 1);
  const ar = findRow('Auth', canon(b.email)); if (ar) sheet('Auth').deleteRow(ar);
  return { ok: true };
}
function adminAddReferral(b) {
  if (!isAdmin(b)) return { error: 'forbidden' };
  credit(canon(b.email) || b.email, Number(b.amount), 'referral', 'Admin referral credit', 'referral');
  return { ok: true };
}

// =====================================================================================
// Accounts: email + password, 6-digit email OTP (no login before verification), sessions.
// Sheets (auto-created): Auth = [email, passHash, salt, verified, createdAt, otpHash, otpExpiry, otpTries, otpPurpose, otpSentAt, name, refCode]
//                        Sessions = [tokenHash, email, expiry]
// Identity is the canonical email: lowercase, "+tag" removed, and for Gmail the dots are removed,
// so a.b+x@gmail.com and ab@gmail.com are the same account (one email = one account).
// NOTE: MailApp sends from the Google account that owns the script: about 100 emails/day on a free Gmail, about 1500/day on Workspace.
// =====================================================================================
const OTP_TTL = 10 * 60 * 1000, SESSION_TTL = 30 * 24 * 3600 * 1000, OTP_GAP = 60 * 1000;

function canon(email) {
  const m = String(email || '').trim().toLowerCase().match(/^([^@\s]+)@([^@\s]+\.[^@\s]+)$/);
  if (!m) return '';
  let local = m[1].split('+')[0], dom = m[2];
  if (dom === 'googlemail.com') dom = 'gmail.com';
  if (dom === 'gmail.com') local = local.replace(/\./g, '');
  return local ? local + '@' + dom : '';
}
const sha = (s) => Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8).map(x => ('0' + (x & 0xff).toString(16)).slice(-2)).join('');
function hashPw(pw, salt) { let h = pw + salt; for (let i = 0; i < 500; i++) h = sha(h + salt); return h; }
function findRow(name, key) {
  const sh = sheet(name), n = sh.getLastRow(); if (n < 1) return 0;
  const f = sh.getRange(1, 1, n, 1).createTextFinder(String(key)).matchEntireCell(true).matchCase(true).findNext();
  return f ? f.getRow() : 0;
}
function profileOf(email) {
  const u = sheet('Users').getDataRange().getValues().find(x => x[0] === email) || [];
  return { email, name: u[1] || '', code: u[2] || '', refBy: u[3] || '' };
}
function newSession(email) {
  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  sheet('Sessions').appendRow([sha(token), email, Date.now() + SESSION_TTL]);
  return token;
}
function sessionOk(b) {
  if (!b.token) return false;
  const row = findRow('Sessions', sha(String(b.token))); if (!row) return false;
  const r = sheet('Sessions').getRange(row, 1, 1, 3).getValues()[0];
  return Number(r[2]) > Date.now() && r[1] === canon(b.email);
}
function me(b) {
  if (!b.token) return { error: 'auth' };
  const row = findRow('Sessions', sha(String(b.token))); if (!row) return { error: 'auth' };
  const r = sheet('Sessions').getRange(row, 1, 1, 3).getValues()[0];
  if (Number(r[2]) <= Date.now()) return { error: 'auth' };
  return { profile: profileOf(r[1]) };
}
function logout(b) {
  const row = b.token ? findRow('Sessions', sha(String(b.token))) : 0;
  if (row) sheet('Sessions').deleteRow(row);
  return { ok: true };
}

function sendOtp(email, purpose) {
  const sh = sheet('Auth'), row = findRow('Auth', email); if (!row) return { ok: true }; // never reveal whether an account exists
  const r = sh.getRange(row, 1, 1, 12).getValues()[0];
  const gap = Date.now() - Number(r[9] || 0);
  if (gap < OTP_GAP) return { error: 'wait', wait: Math.ceil((OTP_GAP - gap) / 1000) };
  const cache = CacheService.getScriptCache(), ck = 'otpn:' + email, n = Number(cache.get(ck) || 0);
  if (n >= 6) return { error: 'too_many_codes' };
  cache.put(ck, String(n + 1), 3600);
  const otp = String(100000 + (parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 8), 16) % 900000));
  sh.getRange(row, 6, 1, 5).setValues([[sha(email + otp + r[2]), Date.now() + OTP_TTL, 0, purpose, Date.now()]]);
  const what = purpose === 'reset' ? 'reset your password' : 'verify your email';
  MailApp.sendEmail({ to: email, name: 'UGrowSMM', subject: otp + ' is your UGrowSMM code',
    body: 'Your UGrowSMM code to ' + what + ' is ' + otp + '.\n\nIt expires in 10 minutes. If you did not ask for this, you can ignore this email. Never share this code with anyone.\n\n- UGrowSMM' });
  return { ok: true };
}
// returns '' when the code is right (and burns it), otherwise an error key
function checkOtp(row, email, otp, purpose) {
  const sh = sheet('Auth'), r = sh.getRange(row, 1, 1, 12).getValues()[0];
  if (!r[5] || r[8] !== purpose) return 'code_invalid';
  if (Number(r[6]) < Date.now()) return 'code_expired';
  if (Number(r[7]) >= 5) return 'too_many_attempts';
  if (sha(email + String(otp || '').trim() + r[2]) !== r[5]) { sh.getRange(row, 8).setValue(Number(r[7]) + 1); return 'code_invalid'; }
  sh.getRange(row, 6, 1, 3).setValues([['', 0, 0]]);
  return '';
}

function signup(b) {
  const email = canon(b.email), name = String(b.name || '').trim().slice(0, 60), pw = String(b.password || '');
  if (!email) return { error: 'invalid_email' };
  if (!name) return { error: 'name_required' };
  if (pw.length < 8 || pw.length > 100) return { error: 'weak_password' };
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sh = sheet('Auth'), row = findRow('Auth', email), salt = Utilities.getUuid();
    const users = sheet('Users').getDataRange().getValues();
    const ref = String(b.ref || '').trim().toUpperCase();
    const refCode = ref && users.some(u => String(u[2]).toUpperCase() === ref) ? ref : '';
    if (row) {
      if (sh.getRange(row, 4).getValue() === 'TRUE') return { error: 'email_exists' };
      // still unverified: let them re-register (new password / name) and resend the code
      sh.getRange(row, 2, 1, 2).setValues([[hashPw(pw, salt), salt]]);
      sh.getRange(row, 11, 1, 2).setValues([[name, refCode]]);
    } else {
      sh.appendRow([email, hashPw(pw, salt), salt, '', new Date(), '', 0, 0, '', 0, name, refCode]);
    }
    const r = sendOtp(email, 'verify');
    return r.error ? r : { ok: true, email };
  } finally { lock.releaseLock(); }
}
function resendOtp(b) {
  const email = canon(b.email); if (!email) return { error: 'invalid_email' };
  const row = findRow('Auth', email); if (!row) return { ok: true };
  const verified = sheet('Auth').getRange(row, 4).getValue() === 'TRUE';
  return sendOtp(email, verified ? 'reset' : 'verify');
}
function verifyEmail(b) {
  const email = canon(b.email), row = email ? findRow('Auth', email) : 0;
  if (!row) return { error: 'code_invalid' };
  const err = checkOtp(row, email, b.otp, 'verify'); if (err) return { error: err };
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const au = sheet('Auth').getRange(row, 1, 1, 12).getValues()[0];
    sheet('Auth').getRange(row, 4).setValue('TRUE');
    const users = sheet('Users').getDataRange().getValues();
    if (!users.some(u => u[0] === email)) {
      let code; do { code = 'UG' + Math.random().toString(36).slice(2, 8).toUpperCase(); } while (users.some(u => u[2] === code));
      const refBy = au[11] && au[11] !== code ? au[11] : '';
      sheet('Users').appendRow([email, au[10] || '', code, refBy, '']);
    }
  } finally { lock.releaseLock(); }
  sheet('Logins').appendRow([new Date(), email, 'signup']);
  return { token: newSession(email), profile: profileOf(email) };
}
function login(b) {
  const email = canon(b.email), pw = String(b.password || '');
  if (!email || !pw) return { error: 'invalid_credentials' };
  const cache = CacheService.getScriptCache(), fk = 'fail:' + email;
  if (Number(cache.get(fk) || 0) >= 8) return { error: 'locked' }; // 8 wrong passwords => 15 minute lock
  const row = findRow('Auth', email), r = row ? sheet('Auth').getRange(row, 1, 1, 12).getValues()[0] : null;
  if (!r || hashPw(pw, r[2]) !== r[1]) { cache.put(fk, String(Number(cache.get(fk) || 0) + 1), 900); return { error: 'invalid_credentials' }; }
  cache.remove(fk);
  if (r[3] !== 'TRUE') { const s = sendOtp(email, 'verify'); return { error: 'not_verified', email, wait: s.wait || 0 }; }
  sheet('Logins').appendRow([new Date(), email, '']);
  return { token: newSession(email), profile: profileOf(email) };
}
function forgotPassword(b) {
  const email = canon(b.email); if (!email) return { error: 'invalid_email' };
  const row = findRow('Auth', email); if (!row) return { ok: true };
  const r = sendOtp(email, 'reset');
  return r.error ? r : { ok: true };
}
function resetPassword(b) {
  const email = canon(b.email), row = email ? findRow('Auth', email) : 0, pw = String(b.password || '');
  if (!row) return { error: 'code_invalid' };
  if (pw.length < 8 || pw.length > 100) return { error: 'weak_password' };
  const err = checkOtp(row, email, b.otp, 'reset'); if (err) return { error: err };
  const salt = Utilities.getUuid();
  sheet('Auth').getRange(row, 2, 1, 3).setValues([[hashPw(pw, salt), salt, 'TRUE']]); // proving the mailbox also verifies it
  const ss_ = sheet('Sessions'), rows = ss_.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 0; i--) if (rows[i][1] === email) ss_.deleteRow(i + 1); // sign out everywhere
  return { ok: true };
}
