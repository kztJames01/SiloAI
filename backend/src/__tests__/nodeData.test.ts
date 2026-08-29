import {
  flattenNodeData,
  interpolateDeep,
  interpolateString,
  redactForLog,
  evalSimpleCondition,
  buildInterpBag,
} from '../engine/nodeData';

describe('nodeData interpolate', () => {
  it('flattens editor config onto the node', () => {
    const flat = flattenNodeData({
      type: 'httpRequest',
      data: { label: 'Call API', prompt: 'hit it', config: { url: 'https://x.test/{{input.id}}', method: 'GET' } },
    });
    expect(flat.url).toBe('https://x.test/{{input.id}}');
    expect(flat.prompt).toBe('hit it');
  });

  it('fills {{input}} and {{prev}} paths', () => {
    const bag = buildInterpBag({
      data: { input: { id: 'abc' }, n1: { status: 200 } },
      previousNodeData: { status: 'ok' },
    });
    expect(interpolateString('https://x.test/{{input.id}}', bag)).toBe('https://x.test/abc');
    expect(interpolateString('was {{prev.status}}', bag)).toBe('was ok');
  });

  it('does not copy secret source paths into other fields', () => {
    const bag = { prev: { apiKey: 'sk-live', status: 'ok' }, input: { orderId: '9' } };
    expect(interpolateString('k={{prev.apiKey}}', bag)).toBe('k=');
    expect(interpolateDeep({ authorization: 'Bearer {{input.orderId}}' }, bag).authorization).toBe('Bearer 9');
    expect(interpolateString('{{constructor.prototype}}', bag)).toBe('');
  });

  it('redacts secrets and prompts in logs', () => {
    const red = redactForLog({
      apiKey: 'sk-live',
      prompt: 'secret prompt',
      status: 200,
      headers: { authorization: 'Bearer x', 'content-type': 'json' },
    });
    expect(red.apiKey).toBe('[redacted]');
    expect(red.prompt).toBe('[redacted]');
    expect(red.status).toBe(200);
    expect(red.headers.authorization).toBe('[redacted]');
    expect(red.headers['content-type']).toBe('json');
  });
});

describe('evalSimpleCondition', () => {
  it('handles booleans and comparisons without eval', () => {
    expect(evalSimpleCondition(true)).toBe(true);
    expect(evalSimpleCondition('false')).toBe(false);
    expect(evalSimpleCondition('ok === ok')).toBe(true);
    expect(evalSimpleCondition('ok !== bad')).toBe(true);
    expect(evalSimpleCondition('10 > 3')).toBe(true);
    expect(evalSimpleCondition(' === missing')).toBe(false);
  });
});
