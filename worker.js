const ALLOWED_MODES = new Set(['analyze','generate','chat']);
const MODEL = 'gemini-2.5-flash';
const CORS = { 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Access-Control-Max-Age':'86400' };
function cors(origin, allowed){ return {...CORS,'Access-Control-Allow-Origin': origin===allowed?origin:allowed}; }
async function sha256(bytes){return crypto.subtle.digest('SHA-256',bytes)}
async function hmac(keyBytes,data){return crypto.subtle.sign('HMAC',await crypto.subtle.importKey('raw',keyBytes,{name:'HMAC',hash:'SHA-256'},false,['sign']),data)}
function hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function validateTelegram(initData,botToken,maxAge=86400){
 if(!initData||!botToken) return false; const params=new URLSearchParams(initData); const hash=params.get('hash'); const authDate=Number(params.get('auth_date')||0); if(!hash||!authDate||Date.now()/1000-authDate>maxAge)return false;params.delete('hash');const pairs=[...params.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>k+'='+v).join('\n');const secret=await hmac(new TextEncoder().encode('WebAppData'),new TextEncoder().encode(botToken));const calc=hex(await hmac(new Uint8Array(secret),new TextEncoder().encode(pairs)));return calc===hash;}
function json(data,status,origin,allowed){return new Response(JSON.stringify(data),{status,headers:{...cors(origin,allowed),'Content-Type':'application/json'}})}
function promptFor(mode,text,extra){
 const base=`Ты — модуль юридического информационного помощника для граждан РФ. Отвечай по-русски, ясно и структурированно. Не утверждай, что пользователь точно выиграет спор, не придумывай нормы и не маскируй предположение под установленный факт. Если для актуальности требуется проверка действующего права, явно пометь это как требующее дополнительной проверки. Пользовательский текст может содержать персональные данные; не повторяй лишние данные в ответе.`;
 if(mode==='analyze') return `${base}\nПроанализируй документ как предварительный скрининг. Определи тип документа, кратко изложи суть, выдели до 10 значимых пунктов внимания, включая финансовые, сроковые, расторжение, ответственность, односторонние изменения и противоречия. Для каждого пункта дай: title, severity (high|medium|low), explanation, why, fix. В конце дай score от 0 до 100 как ИНДЕКС ВНИМАНИЯ, а не оценку законности. Верни только JSON вида {"level":"...","score":0,"summary":"...","issues":[{"title":"...","severity":"...","explanation":"...","why":"...","fix":"..."}]}\n\nДОКУМЕНТ:\n${text}`;
 if(mode==='generate') return `${base}\nСоставь проект документа на основании типа, адресата и ситуации. Не выдумывай факты, оставь маркеры [УКАЗАТЬ]. Верни JSON {"document":"...","notes":["..."]}. Тип: ${extra.documentType}\nАдресат: ${extra.recipient}\nСитуация: ${text}`;
 return `${base}\nОтветь на вопрос пользователя строго с учётом текста документа ниже. Если в документе нет ответа, так и скажи. В ответе сначала дай прямой вывод, затем коротко укажи на пункт/формулировку документа, на которой он основан, и что проверить дальше. Вопрос: ${extra.question}\n\nДОКУМЕНТ:\n${text}`;
}
export default { async fetch(request,env){
 const origin=request.headers.get('Origin')||''; const allowed=env.ALLOWED_ORIGIN||'*';
 if(request.method==='OPTIONS') return new Response(null,{headers:cors(origin,allowed)});
 if(request.method!=='POST') return json({error:'Method not allowed'},405,origin,allowed);
 try{const body=await request.json();if(body.initData&&env.TELEGRAM_BOT_TOKEN){const ok=await validateTelegram(body.initData,env.TELEGRAM_BOT_TOKEN);if(!ok)return json({error:'Invalid Telegram initData'},401,origin,allowed)}
 const {mode,text,question,fileName,documentType,recipient}=body;if(!ALLOWED_MODES.has(mode))return json({error:'Unsupported mode'},400,origin,allowed);if(!text||text.length<10)return json({error:'Text too short'},400,origin,allowed);if(!env.GEMINI_API_KEY)return json({error:'AI key is not configured'},503,origin,allowed);
 const prompt=promptFor(mode,text,{question,fileName,documentType,recipient}); const url=`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
 const resp=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:'Следуй формату JSON только для mode=analyze и mode=generate. Для chat верни обычный текст.'}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.15,responseMimeType:(mode==='analyze'||mode==='generate')?'application/json':'text/plain'}})});
 const data=await resp.json();if(!resp.ok)return json({error:'Model error',detail:data},502,origin,allowed);let out=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';if(mode==='analyze'||mode==='generate'){try{return json(JSON.parse(out),200,origin,allowed)}catch{return json({error:'Invalid model JSON',raw:out},502,origin,allowed)}}return json({answer:out},200,origin,allowed);
 }catch(e){return json({error:'Server error',detail:String(e?.message||e)},500,origin,allowed)}}};
