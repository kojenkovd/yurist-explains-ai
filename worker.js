export default {
  async fetch(request, env) {
    const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
    if (request.method === 'OPTIONS') return new Response('', {headers:cors});
    if (request.method !== 'POST') return new Response(JSON.stringify({error:'POST only'}), {status:405,headers:{'content-type':'application/json',...cors}});
    try {
      const body = await request.json();
      const question = String(body.question || '').slice(0,12000);
      const documentText = String(body.documentText || '').slice(0,50000);
      if (!env.GEMINI_API_KEY) return new Response(JSON.stringify({error:'AI key is not configured'}), {status:503,headers:{'content-type':'application/json',...cors}});
      const prompt = `Ты юридический AI-помощник для граждан РФ. Не выдавай предположение за установленный факт. Отвечай на русском, структурировано и понятным языком. Учитывай только переданный документ и вопрос. Отдельно отмечай, когда нужен юрист.\n\nВОПРОС:\n${question}\n\nДОКУМЕНТ:\n${documentText}`;
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+encodeURIComponent(env.GEMINI_API_KEY), {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:1800}})});
      const data = await res.json();
      if (!res.ok) return new Response(JSON.stringify({error:'AI request failed',details:data}), {status:502,headers:{'content-type':'application/json',...cors}});
      const answer = data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n').trim() || 'Не удалось получить ответ.';
      return new Response(JSON.stringify({answer}), {headers:{'content-type':'application/json',...cors}});
    } catch (e) { return new Response(JSON.stringify({error:'Bad request'}), {status:400,headers:{'content-type':'application/json',...cors}}); }
  }
};
