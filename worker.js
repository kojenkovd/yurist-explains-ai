/**
 * Serverless AI backend for "Юрист объясняет | AI".
 * Deploy to Cloudflare Workers with a Workers AI binding named AI.
 * No model secret is stored in the frontend.
 */
const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const MAX_TEXT = 60000;
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' };
function json(data, status=200){ return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS }); }
function trimText(s){ return String(s||'').slice(0,MAX_TEXT); }
async function runAI(env, prompt){
  if(!env.AI) throw new Error('Workers AI binding AI is not configured');
  return await env.AI.run(MODEL, { prompt, max_tokens: 2200, temperature: 0.15 });
}
function textOf(result){ if(typeof result==='string') return result; if(result?.response) return result.response; if(result?.text) return result.text; return JSON.stringify(result); }
function extractJSON(s){ const start=s.indexOf('{'), end=s.lastIndexOf('}'); if(start<0||end<start) return null; try{return JSON.parse(s.slice(start,end+1))}catch{return null} }
const ANALYZE_SYSTEM = `Ты — AI-помощник сервиса «Юрист объясняет». Анализируешь пользовательский документ для граждан РФ. Не выдумывай факты и нормы права. Не утверждай, что условие незаконно, если для этого недостаточно контекста. Отделяй текст документа от юридической оценки. Возвращай только JSON вида: {"score":0-100,"type":"...","summary":"...","issues":[{"title":"...","note":"...","recommendation":"...","severity":"high|medium|low"}],"questions":["..."]}. score — индекс внимания, а не вероятность незаконности.`;
export default {
 async fetch(request, env){
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:JSON_HEADERS});
  const url=new URL(request.url);
  if(url.pathname==='/health') return json({ok:true,service:'yurist-explains-ai'});
  if(request.method!=='POST') return json({ok:false,error:'Use POST'},405);
  try{
    const body=await request.json();
    if(url.pathname==='/analyze'){
      const text=trimText(body.text);
      if(text.length<30) return json({ok:false,error:'Too little text'},400);
      const prompt=`${ANALYZE_SYSTEM}\n\nДокумент:\n${text}\n\nВерни JSON без markdown.`;
      const raw=textOf(await runAI(env,prompt)); const data=extractJSON(raw);
      return data?json(data):json({ok:true,raw});
    }
    if(url.pathname==='/chat'){
      const message=trimText(body.message); const history=Array.isArray(body.history)?body.history.slice(-12).join('\n'):'';
      const prompt=`Ты — юридический AI-помощник для граждан РФ. Ответь на вопрос понятно, структурированно и осторожно. Не выдумывай нормы. Если не хватает фактов — задай уточняющие вопросы. Это информационная помощь, не юридическое заключение.\nИстория диалога:\n${history}\n\nВопрос:\n${message}`;
      return json({answer:textOf(await runAI(env,prompt))});
    }
    if(url.pathname==='/generate'){
      const type=trimText(body.type), facts=trimText(body.facts);
      const prompt=`Ты готовишь проект юридического документа для гражданина РФ. Сначала не выдумывай отсутствующие данные; неизвестные реквизиты помечай [УТОЧНИТЬ]. Верни чистый текст документа. Тип: ${type}. Факты: ${facts}`;
      return json({document:textOf(await runAI(env,prompt))});
    }
    return json({ok:false,error:'Not found'},404);
  }catch(e){ return json({ok:false,error:e.message||'Server error'},500); }
 }
}
