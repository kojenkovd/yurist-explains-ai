const MODEL = '@cf/qwen/qwen3-30b-a3b-fp8';

function cors(origin, allowed) {
  const allow = allowed && origin === allowed ? origin : (allowed || '*');
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function json(data, status = 200, origin = '*', allowed = '*') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin, allowed) }
  });
}

function systemPrompt(task) {
  return `Ты — юридический AI-помощник сервиса «Юрист объясняет | AI» для пользователей из РФ.
Задача: ${task}.
Работай аккуратно и не выдавай предположения за установленные факты. Не придумывай статьи закона, судебную практику или реквизиты документа. Если данных не хватает — явно укажи это.
Отвечай простым русским языком. Разделяй: 1) что видно из текста; 2) что это может означать; 3) что стоит проверить; 4) следующий безопасный шаг.
Это информационная помощь, а не юридическое заключение.`;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '*';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin, allowed) });
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405, origin, allowed);

    try {
      const body = await request.json();
      const text = String(body?.text || '').trim();
      const task = String(body?.task || 'проведи структурированный анализ').trim();
      const context = String(body?.context || '').trim();
      if (text.length < 20) return json({ error: 'Недостаточно текста для анализа.' }, 400, origin, allowed);
      if (!env.AI) return json({ error: 'AI binding is not configured.' }, 503, origin, allowed);

      const prompt = `${systemPrompt(task)}

Документ/ситуация:
${text.slice(0, 120000)}

${context ? `Дополнительный контекст:\n${context.slice(0, 30000)}` : ''}

Верни результат в JSON со следующими ключами:
summary (string), document_type (string), risks (array of objects with level,title,what_it_says,meaning,check,fix), dates (array of strings), amounts (array of strings), questions (array of strings), next_steps (array of strings).
JSON без markdown-обёртки.`;

      const result = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: 'Отвечай только корректным JSON без markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.15,
        max_tokens: 5000
      });

      const raw = typeof result === 'string' ? result : (result?.response || result?.result || JSON.stringify(result));
      let parsed;
      try { parsed = JSON.parse(raw); } catch (_) { parsed = { summary: raw, document_type: 'Документ', risks: [], dates: [], amounts: [], questions: [], next_steps: [] }; }
      return json({ ok: true, result: parsed, model: MODEL }, 200, origin, allowed);
    } catch (e) {
      return json({ error: e?.message || 'AI request failed' }, 500, origin, allowed);
    }
  }
};
