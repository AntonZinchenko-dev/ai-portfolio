import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agentyard, archforge, flagship, hero, productCase, shibatube, stack } from '../src/content/site.ts';

const cases = [agentyard, shibatube, flagship, archforge, productCase];

test('у каждого кейса заполнены задача, что сделал и стек', () => {
  for (const c of cases) {
    assert.ok(c.summary.length > 40, c.id);
    assert.ok(c.problem.length > 40, c.id);
    assert.ok(c.did.length >= 3, c.id);
    assert.ok(c.stack.length >= 3, c.id);
  }
});

test('якоря кейсов не повторяются', () => {
  const anchors = cases.map((c) => c.anchor);
  assert.equal(new Set(anchors).size, anchors.length);
});

test('на странице не осталось учебных и заказчицких названий', () => {
  const text = JSON.stringify({ cases, hero, stack });
  for (const banned of ['Freight', 'pipewiki', 'PipePass', 'вакансии', 'фабрик']) {
    assert.ok(!text.includes(banned), banned);
  }
});
