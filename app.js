(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready(); tg.expand();
    try { tg.setHeaderColor('#061a37'); tg.setBackgroundColor('#020917'); } catch (_) {}
  }

  const CFG = window.JE_CONFIG || { PAID_TELEGRAM: '', AI_ENDPOINT: '' };
  const MAX_FILE = 10 * 1024 * 1024;
  const state = {
    screen: 'home', fileReport: null, fileName: '', fileText: '',
    history: JSON.parse(localStorage.getItem('jeai_v7_history') || '[]'),
    stats: JSON.parse(localStorage.getItem('jeai_v7_stats') || '{"checks":0,"docs":0,"ai":0,"tests":0}')
  };
  const root = document.getElementById('content');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const toastEl = document.getElementById('toast');
  let toastTimer;

  const save = () => {
    localStorage.setItem('jeai_v7_history', JSON.stringify(state.history.slice(-50)));
    localStorage.setItem('jeai_v7_stats', JSON.stringify(state.stats));
    updateStats();
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = msg => { toastEl.textContent=msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toastEl.classList.remove('show'),2300); };
  const updateStats = () => {
    const map={checks:'statChecks',docs:'statDocs',ai:'statAI'};
    Object.entries(map).forEach(([k,id])=>{const n=document.getElementById(id); if(n) n.textContent=state.stats[k]||0;});
  };
  const openModal = html => { modalBody.innerHTML=html; modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); };
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); modalBody.innerHTML=''; };
  const paid = () => {
    const u=(CFG.PAID_TELEGRAM||'').replace(/^@/,'').trim();
    if(!u){ toast('Добавим ваш Telegram для платных услуг на следующем шаге.'); return; }
    const url='https://t.me/'+u;
    if(tg?.openTelegramLink) tg.openTelegramLink(url); else window.open(url,'_blank','noopener');
  };

  function nav(screen){
    state.screen=screen;
    document.querySelectorAll('[data-screen]').forEach(b=>b.classList.toggle('active',b.dataset.screen===screen));
    render();
  }
  document.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.screen)));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeModal));
  document.querySelectorAll('[data-paid]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();paid()}));

  function render(){
    updateStats();
    if(state.screen==='home') renderHome();
    if(state.screen==='analyze') openAnalyze();
    if(state.screen==='create') openCreate();
    if(state.screen==='ai') openAI();
    if(state.screen==='history') renderHistory();
    if(state.screen==='xray') openXray(state.fileReport,state.fileName);
    if(state.screen==='profile') renderProfile();
  }

  function renderHome(){
    root.innerHTML=`
      <section class="dashboard-hero enter">
        <div class="heroText">
          <div class="tiny-pill"><i></i> ИНТЕЛЛЕКТ · ЗАКОН · ВАША ЗАЩИТА</div>
          <h1>Юрист объясняет <span>AI</span></h1>
          <p class="heroLead">Ваш цифровой помощник в мире права и документов. Анализируйте, создавайте и задавайте вопросы — без юридического языка.</p>
          <div class="heroFeatures">
            <span><b>◈</b> Анализ рисков</span><span><b>▣</b> Поиск дат и сумм</span><span><b>◉</b> AI по документам</span><span><b>✎</b> Генерация документов</span>
          </div>
          <div class="heroButtons"><button class="primaryBtn" id="heroUpload">⇧&nbsp; Загрузить документ</button><button class="darkBtn" id="heroHow">▶&nbsp; Как это работает?</button></div>
          <div class="heroTrust"><span>🔒 файл обрабатывается локально</span><span>⚡ быстрый предварительный скрининг</span></div>
        </div>
      </section>

      <section class="section enter delay1">
        <div class="sectionHead"><div><small>ОСНОВНЫЕ ИНСТРУМЕНТЫ</small><h2>Работаем с вашей задачей</h2></div><span class="chip">БЕСПЛАТНО</span></div>
        <div class="moduleGrid">
          <button class="moduleCard featured" id="mAnalyze"><div class="mIcon">⌑</div><span class="mArrow">↗</span><h3>Анализ документов</h3><p>Договор, соглашение или письмо — найдём пункты, которые стоит проверить.</p><ul><li>Риски и формулировки</li><li>Даты и суммы</li><li>Рекомендации</li></ul><b class="moduleBtn">Начать анализ →</b></button>
          <button class="moduleCard" id="mCreate"><div class="mIcon purple">✎</div><span class="mArrow">↗</span><h3>Создание документов</h3><p>Соберите претензию, заявление, жалобу или требование по шагам.</p><ul><li>Диалог вместо анкеты</li><li>Редактор</li><li>Скачать для Word</li></ul><b class="moduleBtn purpleBtn">Создать документ →</b></button>
          <button class="moduleCard cyan" id="mAI"><div class="mIcon cyanIcon">◉</div><span class="mArrow">↗</span><h3>AI-ассистент</h3><p>Задавайте вопросы по документу и получайте структурированный ответ.</p><ul><li>Контекст документа</li><li>Понятный язык</li><li>Следующие шаги</li></ul><b class="moduleBtn cyanBtn">Открыть AI →</b></button>
          <button class="moduleCard purpleCard" id="mXray"><div class="mIcon purple">✦</div><span class="mArrow">↗</span><h3>Юридический рентген</h3><p>Визуальная карточка с итогом анализа, которой можно поделиться.</p><ul><li>Индекс внимания</li><li>Серьёзные пункты</li><li>Share в Telegram</li></ul><b class="moduleBtn purpleBtn">Запустить рентген →</b></button>
        </div>
      </section>

      <section class="section enter delay2">
        <div class="lowerGrid">
          <div class="panel glass"><div class="panelHead"><div><small>ПОСЛЕДНИЕ ПРОВЕРКИ</small><h3>История анализов</h3></div><button class="linkBtn" id="allHistory">Все →</button></div><div id="recentChecks">${recentRows('check')}</div></div>
          <div class="panel glass"><div class="panelHead"><div><small>СВЕЖИЕ ДОКУМЕНТЫ</small><h3>Ваши материалы</h3></div><button class="linkBtn" id="allDocs">Все →</button></div><div id="recentDocs">${recentRows('document')}</div></div>
          <div class="panel xrayPanel glass"><div class="xrayTop"><div class="mIcon cyanIcon">✦</div><div><small>УМНЫЙ ИНСТРУМЕНТ</small><h3>Юридический рентген</h3></div></div><p>Проведите проверку и получите понятную визуализацию того, что требует внимания.</p><div class="xrayGraphic"><div class="xrayCircle">✦</div></div><button id="runXrayHome" class="primaryBtn">Провести анализ →</button></div>
        </div>
      </section>`;
    document.getElementById('heroUpload').onclick=openAnalyze;document.getElementById('heroHow').onclick=()=>openModal(aboutHtml());
    document.getElementById('mAnalyze').onclick=openAnalyze;document.getElementById('mCreate').onclick=openCreate;document.getElementById('mAI').onclick=openAI;document.getElementById('mXray').onclick=()=>openXray(state.fileReport,state.fileName);
    document.getElementById('allHistory').onclick=()=>nav('history');document.getElementById('allDocs').onclick=()=>nav('history');document.getElementById('runXrayHome').onclick=()=>openXray(state.fileReport,state.fileName);
  }
  function aboutHtml(){return `<h3 class="modalTitle">Как это работает</h3><p class="modalSub">Вы загружаете документ или описываете ситуацию. Сначала приложение извлекает текст и показывает предварительный скрининг. Следующим этапом подключим защищённый AI backend для глубокого контекстного анализа.</p><div class="modalStack"><div class="infoRow"><b>01</b><span>Загрузка и распознавание</span></div><div class="infoRow"><b>02</b><span>Анализ и структура рисков</span></div><div class="infoRow"><b>03</b><span>Понятные рекомендации и документ</span></div></div>`}
  function recentRows(type){
    const arr=state.history.filter(x=>x.type===type).slice(-4).reverse();
    if(!arr.length)return `<div class="empty">Пока пусто<br><span>Запустите первую проверку.</span></div>`;
    return arr.map(x=>`<button class="historyRow" data-open-history="${esc(x.id)}"><div class="fileIcon">▤</div><div class="rowText"><b>${esc(x.name)}</b><span>${type==='check'?'Индекс '+x.score+'/100 · ':''}${new Date(x.at).toLocaleDateString('ru-RU')}</span></div><em>${type==='check'?(x.issues||0)+' п.':'Создан'}</em><strong>›</strong></button>`).join('');
  }

  async function loadScript(src){return new Promise((resolve,reject)=>{const e=document.querySelector(`script[src="${src}"]`);if(e)return resolve();const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
  async function extract(file,status){
    if(file.size>MAX_FILE)throw new Error('Файл больше 10 МБ.');
    const ext=file.name.toLowerCase().split('.').pop();
    if(ext==='txt')return file.text();
    if(ext==='docx'){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js');const r=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return r.value||''}
    if(ext==='pdf'){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;let out='';const n=Math.min(pdf.numPages,25);for(let i=1;i<=n;i++){status.textContent=`Читаем страницу ${i} из ${n}…`;const p=await pdf.getPage(i);const c=await p.getTextContent();out+=c.items.map(x=>x.str).join(' ')+'\n'}return out}
    if(['jpg','jpeg','png','webp'].includes(ext)){await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');const r=await window.Tesseract.recognize(file,'rus+eng',{logger:m=>{if(m.progress)status.textContent='Распознаём фото: '+Math.round(m.progress*100)+'%'}});return r.data.text||''}
    throw new Error('Формат не поддерживается. Используйте PDF, DOCX, TXT, JPG, PNG или WEBP.');
  }
  function detectType(t){const s=t.toLowerCase();if(/аренд|найм жилья/.test(s))return'Договор аренды';if(/купли-продаж|продавец|покупател/.test(s))return'Купля-продажа';if(/трудов|работодател|работник|зарплат/.test(s))return'Трудовые отношения';if(/кредит|займ|заём/.test(s))return'Кредит / займ';if(/услуг|исполнитель|заказчик/.test(s))return'Оказание услуг';return'Документ'}
  function analyzeText(text){
    const t=text.replace(/\s+/g,' ').trim();
    const rules=[
      ['Одностороннее изменение условий','Одна сторона может менять цену, срок или другие условия без отдельного согласования.','Проверьте процедуру и пределы таких изменений.','Зафиксировать изменение только по письменному соглашению.',3,['односторон','вправе.*изменить','может.*изменять']],
      ['Штрафы и неустойки','Найдены санкции за нарушение обязательств.','Проверьте размер, условия начисления и предел.','Сопоставить ответственность обеих сторон.',2,['штраф','неустойк','пеня']],
      ['Автопродление','Есть формулировка об автоматическом продлении.','Важен срок и способ уведомления об отказе.','Сделать срок уведомления явным.',2,['автоматическ.*продл','пролонгац']],
      ['Предоплата / аванс','Указана предоплата, аванс или задаток.','Проверьте основания возврата и удержания.','Зафиксировать условия возврата.',2,['предоплат','аванс','задаток']],
      ['Расторжение договора','Есть условия прекращения или одностороннего отказа.','Важны основания, сроки и финансовые последствия.','Уточнить основания и порядок уведомления.',2,['расторжен','отказ.*от']],
      ['Ответственность сторон','Определена ответственность за нарушение.','Проверьте симметрию и ограничения ответственности.','Сверить последствия одинаковых нарушений.',1,['ответственност']],
      ['Порядок споров','Есть условия о суде, подсудности или претензионном порядке.','Проверьте, куда и в какой срок обращаться.','Уточнить досудебный порядок и подсудность.',1,['подсудн','суд','претензионн']],
      ['Персональные данные','Есть положения о персональных данных.','Проверьте состав данных и цели обработки.','Ограничить состав и цели обработки.',1,['персональн.*данн','152[- ]?фз']],
      ['Срок оплаты','Обнаружены условия о сроке расчётов.','Проверьте, с какого события начинается срок.','Сделать срок однозначным.',1,['срок.*оплат','оплат.*срок']]
    ];
    const issues=[];
    for(const [title,note,why,fix,w,keys] of rules) if(keys.some(k=>new RegExp(k,'iu').test(t)))issues.push({title,note,why,fix,weight:w});
    const dates=t.match(/\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/g)||[];const amounts=t.match(/\b\d[\d\s]*(?:[.,]\d{1,2})?\s?(?:₽|руб(?:\.|лей)?)\b/giu)||[];const score=Math.min(100,35+issues.reduce((a,x)=>a+x.weight*7,0)+(dates.length?5:0)+(amounts.length?5:0));
    return {type:detectType(t),score,level:score>=72?'Высокое внимание':score>=55?'Есть что проверить':'Базовый скрининг',issues,dates:dates.slice(0,12),amounts:amounts.slice(0,12),chars:t.length};
  }
  async function deepAI(text,task,context=''){
    const endpoint=String(CFG.AI_ENDPOINT||'').trim();if(!endpoint)return null;
    const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task,text,context})});if(!res.ok)throw new Error('AI backend вернул ошибку '+res.status);const data=await res.json();return data.result||null;
  }
  function saveReport(name,text,report){
    const id=Date.now().toString(36);state.fileReport={...report,id};state.fileName=name;state.fileText=text;
    state.history.push({id,type:'check',name,at:new Date().toISOString(),score:report.score,issues:report.issues.length,text:text.slice(0,120000),report});state.stats.checks++;save();return id;
  }
  function renderReport(name,r,ai=null){
    const risks=(ai?.risks?.length?ai.risks:r.issues).slice(0,8); const type=ai?.document_type||r.type; const summary=ai?.summary||`Предварительный скрининг документа типа «${type}» отметил ${r.issues.length} пунктов для внимания.`;
    openModal(`<div class="reportHeader"><div class="scoreRing"><strong>${ai?'AI':r.score}</strong><small>${ai?'': '/100'}</small></div><div><div class="reportKicker">РЕЗУЛЬТАТ ПРОВЕРКИ</div><h3 class="modalTitle">${esc(type)}</h3><p class="modalSub">${esc(name)}</p></div></div><div class="modalStack"><div class="resultCard"><b>Кратко</b><p>${esc(summary)}</p></div>${risks.map(x=>`<div class="riskCard"><div class="riskHead"><span class="riskDot ${x.level==='high'||x.weight>=2?'high':''}"></span><b>${esc(x.title||x.name||'Пункт для внимания')}</b></div><p>${esc(x.what_it_says||x.note||'Требуется дополнительная проверка контекста.')}</p><div class="riskWhy"><b>Что сделать:</b> ${esc(x.fix||x.check||x.why||'Уточнить формулировку и проверить применимые нормы.')}</div></div>`).join('')}${(r.dates.length||r.amounts.length)?`<div class="resultCard"><b>Найденные данные</b><p>${r.dates.length?'Даты: '+esc(r.dates.join(', '))+'<br>':''}${r.amounts.length?'Суммы: '+esc(r.amounts.join(', ')):''}</p></div>`:''}<button class="primaryBtn wide" id="askDoc">Задать вопрос по этому документу</button><button class="darkBtn wide" id="xrayDoc">Создать юридический рентген</button><button class="darkBtn wide" id="paidDoc">Проверить у юриста</button><div class="legalNote">Автоматический анализ является предварительным информационным скринингом и не заменяет юридическое заключение.</div></div>`);
    document.getElementById('askDoc').onclick=()=>openAI(true);document.getElementById('xrayDoc').onclick=()=>openXray(r,name);document.getElementById('paidDoc').onclick=paid;
  }

  function openAnalyze(){
    openModal(`<h3 class="modalTitle">Анализ документов</h3><p class="modalSub">Загрузите один или несколько файлов. Приложение извлечёт текст и сделает предварительный скрининг. Файлы остаются в браузере.</p><div class="modalStack"><div class="uploadBox"><div class="uploadIcon">⇧</div><b id="fileLabel">Выберите документы</b><small>PDF · DOCX · TXT · JPG · PNG · WEBP · до 10 МБ на файл</small><input id="files" type="file" multiple accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp" hidden><button class="primaryBtn" id="pickFiles">Выбрать файлы</button></div><div id="fileList" class="fileList"></div><textarea id="pasteText" class="field" placeholder="Или вставьте текст документа…"></textarea><button id="runAnalyze" class="primaryBtn wide">Запустить анализ</button><div id="status" class="status"></div></div>`);
    const input=document.getElementById('files'), list=document.getElementById('fileList'), status=document.getElementById('status');
    document.getElementById('pickFiles').onclick=()=>input.click();input.onchange=()=>{state.selectedFiles=[...input.files];list.innerHTML=state.selectedFiles.map(f=>`<div class="chosen"><span>▤</span><b>${esc(f.name)}</b><small>${(f.size/1024/1024).toFixed(1)} МБ</small></div>`).join('');document.getElementById('fileLabel').textContent=state.selectedFiles.length+' файл(ов) выбранo'};
    document.getElementById('runAnalyze').onclick=async()=>{try{let text=document.getElementById('pasteText').value.trim(),name='Вставленный текст';if(state.selectedFiles?.length){const chunks=[];for(const f of state.selectedFiles){status.textContent='Обрабатываем '+f.name+'…';chunks.push('--- '+f.name+' ---\n'+await extract(f,status));}text=chunks.join('\n');name=state.selectedFiles.length===1?state.selectedFiles[0].name:`${state.selectedFiles.length} связанных файла`; }if(text.length<20)throw new Error('Загрузите файл или вставьте больше текста.');status.textContent='Формируем отчёт…';const r=analyzeText(text);saveReport(name,text,r);let ai=null;try{ai=await deepAI(text,'провести глубокий структурированный анализ документа',`Базовый скрининг: ${r.issues.map(i=>i.title).join(', ')}`)}catch(e){status.textContent='AI пока не подключён — показываем предварительный скрининг.'}renderReport(name,r,ai);}catch(e){status.textContent=e.message||'Не удалось обработать документ.'}};
  }

  function openCreate(){
    const choices=[['Претензия продавцу','Возврат денег, товар или услуга','consumer'],['Заявление работодателю','Зарплата, отпуск, документы','work'],['Жалоба / обращение','Госорган, УК, организация','complaint'],['Требование контрагенту','Договор и обязательства','claim'],['Доверенность','Для физических и юридических лиц','power']];
    openModal(`<h3 class="modalTitle">Создание документов</h3><p class="modalSub">Выберите задачу — приложение задаст только нужные вопросы.</p><div class="choiceGrid">${choices.map(c=>`<button class="choice" data-type="${c[2]}"><b>${c[0]}</b><span>${c[1]}</span><i>›</i></button>`).join('')}</div><div class="legalNote">Готовый текст — проект документа. Перед отправкой проверьте факты и применимые требования.</div>`);
    document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>createForm(b.dataset.type));
  }
  function createForm(type){
    const title={consumer:'Претензия продавцу',work:'Заявление работодателю',complaint:'Жалоба / обращение',claim:'Требование контрагенту',power:'Доверенность'}[type];
    openModal(`<h3 class="modalTitle">${title}</h3><p class="modalSub">Шаг 1 из 2 · расскажите, что произошло.</p><div class="progressBar"><i></i></div><div class="modalStack"><input id="recipient" class="input" placeholder="Кому документ? (название организации / ФИО)"><input id="subject" class="input" placeholder="Предмет / сумма / договор (при наличии)"><textarea id="story" class="field" placeholder="Опишите ситуацию своими словами: даты, события, что вы требовали и какой результат нужен."></textarea><button id="makeDoc" class="primaryBtn wide">Сформировать проект</button></div>`);
    document.getElementById('makeDoc').onclick=()=>{const recipient=document.getElementById('recipient').value.trim(),subject=document.getElementById('subject').value.trim(),story=document.getElementById('story').value.trim();if(!recipient||story.length<15){toast('Нужно указать адресата и описать ситуацию');return}generateDoc(title,recipient,subject,story)};
  }
  function generateDoc(title,recipient,subject,story){
    const date=new Date().toLocaleDateString('ru-RU'); const body=`${recipient}\n\n${title.toUpperCase()}\n\nЯ обращаюсь по вопросу: ${subject||'____________________'}.\n\nОбстоятельства:\n${story}\n\nПРОШУ:\n1. Рассмотреть настоящее обращение.\n2. Сообщить о принятом решении в письменной форме.\n3. При необходимости предоставить обоснование и копии документов, относящихся к рассмотрению обращения.\n\nДата: ${date}\nПодпись: ____________________`;
    state.stats.docs++;state.history.push({id:Date.now().toString(36),type:'document',name:title,at:new Date().toISOString(),text:body});save();
    openModal(`<h3 class="modalTitle">Документ готов</h3><p class="modalSub">Можно отредактировать текст и скачать файл.</p><div class="modalStack"><textarea id="docEdit" class="docEditor">${esc(body)}</textarea><button class="primaryBtn wide" id="downloadTxt">Скачать TXT</button><button class="darkBtn wide" id="downloadDoc">Скачать для Word (.doc)</button><button class="darkBtn wide" id="saveDoc">Сохранить изменения</button><button class="darkBtn wide" id="docPaid">Доработать с юристом</button><div class="legalNote">Это проект документа, сформированный по введённым данным.</div></div>`);
    const get=()=>document.getElementById('docEdit').value;document.getElementById('downloadTxt').onclick=()=>download('text/plain;charset=utf-8',title+'.txt',get());document.getElementById('downloadDoc').onclick=()=>download('application/msword',title+'.doc','<html><meta charset="utf-8"><body style="font-family:Arial">'+esc(get()).replace(/\n/g,'<br>')+'</body></html>');document.getElementById('saveDoc').onclick=()=>toast('Изменения сохранены на этом устройстве');document.getElementById('docPaid').onclick=paid;
  }
  function download(type,name,data){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},700);toast('Файл подготовлен')}

  function openAI(withDoc=false){
    const ctx=withDoc&&state.fileReport?`Контекст документа: ${state.fileReport.type}. Найдено пунктов: ${state.fileReport.issues.map(x=>x.title).join(', ')}`:'';
    openModal(`<h3 class="modalTitle">AI-ассистент</h3><p class="modalSub">${withDoc?'Разговор по текущему документу.':'Опишите ситуацию обычными словами.'}</p><div class="chat" id="chat"><div class="bubble ai">Здравствуйте. Опишите вопрос — я помогу разложить ситуацию на факты, документы, сроки и следующие шаги.</div></div><div class="chatRow"><textarea id="chatInput" class="chatInput" placeholder="Напишите сообщение…"></textarea><button id="send" class="sendBtn">➤</button></div><div class="legalNote">Глубокий AI будет подключён через защищённый backend; до этого доступен локальный режим.</div>`);
    state.stats.ai++;save();const chat=document.getElementById('chat'),input=document.getElementById('chatInput');
    const send=async()=>{const q=input.value.trim();if(!q)return;chat.insertAdjacentHTML('beforeend',`<div class="bubble me">${esc(q)}</div>`);input.value='';chat.insertAdjacentHTML('beforeend','<div class="bubble ai" id="pending">Думаю…</div>');chat.scrollTop=chat.scrollHeight;let answer='';try{const ai=await deepAI(q,'ответить на юридический вопрос простым языком',ctx);answer=ai?.summary||ai?.answer||''}catch(_){}if(!answer)answer=localAnswer(q);document.getElementById('pending')?.remove();chat.insertAdjacentHTML('beforeend',`<div class="bubble ai">${esc(answer)}</div>`);chat.scrollTop=chat.scrollHeight};
    document.getElementById('send').onclick=send;input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
  }
  function localAnswer(q){const t=q.toLowerCase();if(/вернут|деньг|магазин|товар/.test(t))return'Зафиксируйте покупку, оплату, переписку и отказ. Затем можно подготовить претензию и проверить сроки и условия возврата.';if(/увол|работ|зарплат/.test(t))return'Сохраните документы работодателя, даты и переписку. Не подписывайте непонятные документы до проверки их содержания.';if(/аренд|залог|квартир/.test(t))return'Проверьте договор, условия возврата залога, срок уведомления и порядок расторжения. Пришлите текст договора для скрининга.';if(/штраф|пристав|долг/.test(t))return'Сначала определите, кто направил документ, что именно требуют и какой срок указан. Само название письма ещё не определяет юридические последствия.';return'Разделите ситуацию на четыре части: что произошло, когда, какие документы есть и чего вы хотите добиться. После этого легче выбрать правильный документ и порядок действий.'}

  function openXray(report,name){
    if(!report){openModal(`<h3 class="modalTitle">Юридический рентген</h3><p class="modalSub">Сначала загрузите документ и проведите анализ.</p><button class="primaryBtn wide" id="xrayGo">Загрузить документ</button>`);document.getElementById('xrayGo').onclick=openAnalyze;return}
    const high=report.issues.filter(x=>x.weight>=2).length;
    openModal(`<div class="xrayHero"><div class="xrayBig">${report.score}</div><div><small>ИНДЕКС ВНИМАНИЯ</small><h3>Проверка завершена</h3><p>${high} важных пунктов · ${report.issues.length} всего</p></div></div><div class="modalStack"><div class="shareCard"><div class="shareBrand">⚖ ЮРИСТ ОБЪЯСНЯЕТ | AI</div><strong>${esc(name||'Документ')}</strong><span>${high} серьёзных · ${report.issues.length-high} дополнительных пунктов</span><b>${report.score}/100</b><small>Проверьте свой документ →</small></div><button class="primaryBtn wide" id="shareX">Поделиться в Telegram</button><button class="darkBtn wide" id="paidX">Нужен юрист →</button></div>`);
    document.getElementById('shareX').onclick=()=>{const text=`⚖️ Юридический рентген\n${name||'Документ'}\nИндекс внимания: ${report.score}/100\nПунктов для внимания: ${report.issues.length}\n\nЮрист объясняет | AI`;const url=`https://t.me/share/url?url=${encodeURIComponent('https://kojenkovd.github.io/yurist-explains-ai/')}&text=${encodeURIComponent(text)}`;if(tg?.openTelegramLink)tg.openTelegramLink(url);else navigator.clipboard?.writeText(text).then(()=>toast('Карточка скопирована'))};document.getElementById('paidX').onclick=paid;
  }

  function renderHistory(){
    const rows=state.history.slice().reverse();
    root.innerHTML=`<section class="section page enter"><div class="sectionHead"><div><small>ХРАНИЛИЩЕ</small><h2>История</h2></div><span class="chip">${rows.length}</span></div><div class="historyPanel glass">${rows.length?rows.map(x=>`<button class="historyRow" data-hid="${x.id}"><div class="fileIcon">${x.type==='check'?'⌑':'✎'}</div><div class="rowText"><b>${esc(x.name)}</b><span>${new Date(x.at).toLocaleString('ru-RU')}</span></div><em>${x.type==='check'?'Проверка':'Документ'}</em><strong>›</strong></button>`).join(''):'<div class="empty">История пока пуста</div>'}</div></section>`;
    document.querySelectorAll('[data-hid]').forEach(b=>b.onclick=()=>{const x=state.history.find(y=>y.id===b.dataset.hid);if(!x)return;if(x.type==='check'){state.fileReport=x.report;state.fileName=x.name;state.fileText=x.text;renderReport(x.name,x.report)}else{openModal(`<h3 class="modalTitle">${esc(x.name)}</h3><div class="modalStack"><textarea class="docEditor">${esc(x.text||'')}</textarea></div>`)}});
  }
  function renderProfile(){root.innerHTML=`<section class="section page enter"><div class="sectionHead"><div><small>АККАУНТ</small><h2>Профиль</h2></div></div><div class="profileTop glass"><div class="avatarBig">Д</div><div><h3>Дмитрий</h3><p>Бесплатный тариф</p></div></div><div class="statGrid"><div class="statCard glass"><b>${state.stats.checks}</b><span>проверок</span></div><div class="statCard glass"><b>${state.stats.docs}</b><span>документов</span></div><div class="statCard glass"><b>${state.stats.ai}</b><span>вопросов AI</span></div></div><div class="modalStack"><button class="primaryBtn wide" data-paid>Платные услуги юриста →</button><button class="darkBtn wide" id="clearAll">Очистить историю на этом устройстве</button></div></section>`;document.querySelector('[data-paid]')?.addEventListener('click',paid);document.getElementById('clearAll').onclick=()=>{state.history=[];state.stats={checks:0,docs:0,ai:0,tests:0};save();toast('Локальная история очищена');renderProfile()}}

  // Global dynamic history actions.
  document.addEventListener('click',e=>{const b=e.target.closest('[data-open-history]');if(!b)return;const x=state.history.find(y=>y.id===b.dataset.openHistory);if(x?.type==='check'){state.fileReport=x.report;state.fileName=x.name;state.fileText=x.text;renderReport(x.name,x.report)}else if(x){openModal(`<h3 class="modalTitle">${esc(x.name)}</h3><div class="modalStack"><textarea class="docEditor">${esc(x.text||'')}</textarea></div>`)}});

  window.JE_APP={state,nav,openAnalyze,openCreate,openAI,openXray};
  render();
})();
