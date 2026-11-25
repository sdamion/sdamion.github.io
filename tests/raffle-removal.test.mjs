import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const template = readFileSync(new URL('../delegators/delegator-dashboard-template.js', import.meta.url), 'utf8');
const access = readFileSync(new URL('../delegators/delegator-access.js', import.meta.url), 'utf8');

test('dashboard templates remove raffle/prize/draw/exclusion screens but keep admin tools', () => {
  for (const id of ['raffle-open','raffle-prizes-open','raffle-draw-form','raffle-exclusions-form','raffle-overlay','raffle-prizes-overlay','raffle-lost-stake-open']) assert.ok(!template.includes(`id="${id}"`), id);
  for (const id of ['raffle-wallet-list','raffle-admin-users-form','website-status-open','member-portfolio-open','portfolio-access-list']) assert.ok(template.includes(`id="${id}"`), id);
  assert.doesNotMatch(template, />Raffles<|>Prizes<|Draw and Publish/);
});

test('admin dashboard renders without raffle fields or requests', () => {
  const calls = [];
  const code = access.slice(access.indexOf('function renderAdmin('), access.indexOf('function renderPortfolioAccess('));
  const context = {renderPortfolioAccess: () => calls.push('portfolio'), renderAdminUsers: users => calls.push(users.length), raffleAdminUsers: []};
  vm.createContext(context); vm.runInContext(code, context);
  context.renderAdmin({admin_users: [{address: 'admin'}], capabilities: {admin_users: true}});
  assert.deepEqual(calls, ['portfolio', 1]);
  const delegator = access.slice(access.indexOf('function renderDelegator('), access.indexOf('async function loadProtectedArea('));
  assert.doesNotMatch(delegator, /loadRafflePrizes\(|renderDraws\(/);
});
