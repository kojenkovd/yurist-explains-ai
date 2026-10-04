(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready(); tg.expand();
    try { tg.setHeaderColor('#041a3a'); tg.setBackgroundColor('#020a19'); } catch (_) {}
  }
  if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // Поставим реальный username после того, как владелец пришлёт его.
  const PAID_TELEGRAM = 'CHANGE_ME';
  const MAX_FILE = 10 * 1024 * 1024;
  const view = document.getElementById('view');
  const sheet = document.getElementById('sheet');
  const sheetBody = document.getElementById('sheetBody');
  const toastEl = document.getElementById('toast');
  const state = {
    screen:'home', selectedFile:null, currentReport:null, currentText:'', currentFileName:'',
    history: load('jeai_history', []), stats: load('jeai_stats',{checks:0,docs:0,tests:0}),
    lastCreated:''
  };
  let toastTimer;

  function load(k,f){try{return JSON.parse(localStorage.getItem(k)) ?? f}catch(_){return f}}
  function save(){localStorage.setItem('jeai_history',JSON.stringify(state.history.slice(-30)));localStorage.setItem('jeai_stats',JSON.stringify(state.stats))}
  function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),2300)}
  function openSheet(html){sheetBody.innerHTML=html;sheet.classList.add('open');sheet.setAttribute('aria-hidden','false')}
  function closeSheet(){sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');sheetBody.innerHTML='';state.selectedFile=null}
  function paid(){if(PAID_TELEGRAM==='CHANGE_ME'){toast('Ссылка на платные услуги ещё не настроена');return}const url='https://t.me/'+PAID_TELEGRAM.replace(/^@/,'');if(tg?.openTelegramLink)tg.openTelegramLink(url);else window.open(url,'_blank','noopener')}
  function addHistory(item){state.history.push({at:new Date().toISOString(),...item});save()}

  function nav(name){
    state.screen=name;
    document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));
    render();
  }
  document.querySelectorAll('#nav button,[data-screen]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.screen)));
  document.addEventListener('click',e=>{const a=e.target.closest('[data-close]');if(a)closeSheet();const p=e.target.closest('[data-paid]');if(p){e.preventDefault();paid()}});

  function render(){
    if(state.screen==='home')renderHome();
    else if(state.screen==='documents')renderDocuments();
    else if(state.screen==='ai')openAI();
    else if(state.screen==='xray')openXray(state.currentReport,state.currentFileName);
    else if(state.screen==='profile')renderProfile();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderHome(){
    view.innerHTML=`<div class="screen enter">
      <section class="hero"><div class="heroInner">
        <div class="pill"><i></i> РОССИЯ · ONLINE</div>
        <h1>Юрист объясняет.<br><span>Просто. Чётко. По делу.</span></h1>
        <p class="lead">Загрузите документ, опишите ситуацию или создайте юридический текст — всё в одном приложении.</p>
        <div class="heroButtons"><button class="btn btnMain" id="homeAnalyze">✦ Проверить документ</button><button class="btn btnDark" id="homeAsk">◉ Спросить AI</button></div>
        <div class="micro"><span>⌾ файл остаётся на устройстве</span><span>⚡ быстрый предварительный скрининг</span></div>
      </div></section>

      <section class="section"><div class="head"><div><small>ВОЗЬМЁМ НА СЕБЯ</small><h2>Что вам нужно?</h2></div><span class="freeChip">БЕСПЛАТНО</span></div>
        <div class="grid">
          <button class="card primary" id="cardAnalyze"><div class="iconBox">⌑</div><span class="arrow">↗</span><b>Проверить документ</b><p>PDF, DOCX, TXT или фото. Риски, даты, суммы и важные условия.</p></button>
          <button class="card" id="cardCreate"><div class="iconBox">✎</div><span class="arrow">↗</span><b>Создать документ</b><p>Претензия, заявление, жалоба, требование и другое.</p></button>
          <button class="card" id="cardAsk"><div class="iconBox">◌</div><span class="arrow">↗</span><b>Спросить AI</b><p>Опишите ситуацию обычными словами.</p></button>
          <button class="card special" id="cardXray"><div class="iconBox">✦</div><span class="arrow">↗</span><b>Юридический рентген</b><p>Сделайте наглядную карточку по итогам проверки.</p></button>
        </div>
      </section>

      <section class="section"><div class="promo glass" id="promo"><small class="head" style="display:block;margin:0;color:#80a9d1;letter-spacing:.15em;font-size:9px;font-weight:900">ПЕРЕД ПОДПИСЬЮ</small><h3>Проверьте договор<br>до того, как подписать.</h3><p>Система найдёт пункты, которые стоит перечитать, уточнить или обсудить.</p><span class="promoBtn">Начать проверку →</span><div class="promoRing">⚖</div></div></section>

      <section class="section"><div class="head"><div><small>ПЛАТНЫЕ УСЛУГИ</small><h2>Когда нужен специалист</h2></div></div>
        <div class="services">
          <article class="service"><div class="serviceTop"><div class="serviceIcon">♛</div><span class="serviceTag">PRO</span></div><b>Проверка юристом</b><p>Ручной разбор и комментарии по ключевым пунктам.</p><button data-paid>Связаться →</button></article>
          <article class="service"><div class="serviceTop"><div class="serviceIcon">✎</div><span class="serviceTag">PRO</span></div><b>Подготовка документа</b><p>Индивидуальный текст под вашу ситуацию.</p><button data-paid>Заказать →</button></article>
          <article class="service"><div class="serviceTop"><div class="serviceIcon">⚡</div><span class="serviceTag">PRO</span></div><b>Срочная консультация</b><p>Когда вопрос нельзя откладывать.</p><button data-paid>Написать →</button></article>
        </div>
      </section>
      <footer style="text-align:center;padding:24px 0 120px;color:#6684a7;font-size:9px"><button data-paid style="background:none;color:#6cd4ff;font-weight:900">Платные услуги в Telegram →</button><div style="margin-top:9px">Право. Технологии. Твоя защита.</div><div style="margin-top:9px;color:#88b6e5;font-weight:800;letter-spacing:.06em">Made by kojenkov</div></footer>
    </div>`;
    document.getElementById('homeAnalyze').onclick=openAnalyze;document.getElementById('homeAsk').onclick=openAI;document.getElementById('cardAnalyze').onclick=openAnalyze;document.getElementById('cardCreate').onclick=openCreate;document.getElementById('cardAsk').onclick=openAI;document.getElementById('cardXray').onclick=()=>openXray(state.currentReport,state.currentFileName);document.getElementById('promo').onclick=openAnalyze;
  }

  async function loadScript(src){return new Promise((resolve,reject)=>{if(document.querySelector('script[src="'+src+'"]'))return resolve();const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}

  async function extract(file,status){
    const ext=file.name.toLowerCase().split('.').pop();
    if(file.size>MAX_FILE)throw new Error('Файл больше 10 МБ.');
    if(ext==='txt')return await file.text();
    if(ext==='docx'){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js');const r=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return r.value||''}
    if(ext==='pdf'){if(!window.pdfjsLib)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;let out='';const total=Math.min(pdf.numPages,25);for(let i=1;i<=total;i++){status.textContent='Читаем страницу '+i+' из '+total+'…';const page=await pdf.getPage(i);const c=await page.getTextContent();out+=c.items.map(x=>x.str).join(' ')+'\n'}return out}
    if(['jpg','jpeg','png','webp'].includes(ext)){await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');const r=await window.Tesseract.recognize(file,'rus+eng',{logger:m=>{if(m.progress)status.textContent='Распознаём фото: '+Math.round(m.progress*100)+'%'}});return r.data.text||''}
    throw new Error('Поддерживаются PDF, DOCX, TXT, JPG, PNG и WEBP.');
  }

  function detectType(text){
    const t=text.toLowerCase();
    if(/аренд|найм жилья|жилья/.test(t))return'Договор аренды';
    if(/купли-продаж|продавец|покупател/.test(t))return'Купля-продажа';
    if(/трудов|работодател|работник|зарплат/.test(t))return'Трудовые отношения';
    if(/оказани[ея] услуг|исполнитель|заказчик/.test(t))return'Оказание услуг';
    if(/займ|кредит|заём/.test(t))return'Кредит / займ';
    return'Документ';
  }

  function analyze(text){
    const t=text.replace(/\s+/g,' ').trim();
    const rules=[
      ['Одностороннее изменение условий','Одна сторона может получить возможность менять условия, стоимость или сроки без отдельного согласования.','Проверьте, какие именно условия можно менять и как оформляется изменение.','зафиксировать изменение только по письменному соглашению',['односторон','вправе.*изменить','может.*изменять'],3],
      ['Штрафы и неустойки','В документе есть санкции за нарушение обязательств. Важно проверить размер и условия начисления.','Сопоставьте санкции обеих сторон и наличие предельного размера.','штраф|неустойк|пеня|пеню',2],
      ['Автопродление','Есть признаки автоматического продления договора.','Проверьте срок уведомления и способ отказа от продления.','автоматическ.*продл|пролонгац',2],
      ['Предоплата / аванс','Упомянуты аванс, предоплата или задаток.','Посмотрите условия возврата и основания удержания суммы.','предоплат|аванс|задаток',2],
      ['Расторжение договора','Присутствуют положения о прекращении или одностороннем отказе.','Сверьте основания, сроки уведомления и последствия расторжения.','расторжен|отказ.*от',2],
      ['Ответственность сторон','Разделяет риски и последствия нарушений.','Проверьте, насколько симметрична ответственность и есть ли ограничения.','ответственност',1],
      ['Порядок споров','Указан суд, подсудность или претензионный порядок.','Убедитесь, что понятно, куда и в какой срок обращаться до суда.','подсудн|арбитраж|суд|претензионн',1],
      ['Персональные данные','Есть положения о персональных данных.','Проверьте состав данных, цели и условия обработки.','персональн.*данн|152[- ]?фз',1],
      ['Срок оплаты','Найдены условия о сроке расчётов.','Проверьте событие, дату и последствия просрочки.','срок.*оплат|оплат.*срок',1],
      ['Несовпадение дат','Найдены даты, которые стоит сопоставить между собой.','Проверьте сроки договора, поставки, оплаты и уведомлений на внутреннюю согласованность.','\\b\\d{1,2}[./]\\d{1,2}[./]\\d{2,4}\\b',1]
    ];
    const issues=[];
    for(const r of rules){
      const ok=Array.isArray(r[4])?r[4].some(k=>new RegExp(k,'iu').test(t)):new RegExp(r[4],'iu').test(t);
      if(ok)issues.push({title:r[0],note:r[1],why:r[2],fix:r[3],weight:r[5]});
    }
    const money=t.match(/\b\d[\d\s]*(?:[.,]\d{1,2})?\s?(?:₽|руб(?:\.|лей)?)\b/giu)||[];
    const dates=t.match(/\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/g)||[];
    const emails=t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu)||[];
    const phones=t.match(/(?:\+?7|8)[\s()-]*\d{3}[\s()-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g)||[];
    const contradiction=[];
    const amountWords=['цена','стоимость','сумма','оплата','вознаграждение'];
    for(const w of amountWords){
      const hits=[...t.matchAll(new RegExp(w+'[^.]{0,120}(\\d[\\d ]*)(?:₽|руб)','giu'))].map(m=>m[0]);
      if(hits.length>1)contradiction.push({title:'Несколько сумм рядом с одним условием',note:'В документе найдено несколько денежных значений вокруг формулировок о '+w+'. Стоит сопоставить их.'});
    }
    let score=Math.min(100,36+issues.reduce((s,x)=>s+x.weight*6,0)+Math.min(10,dates.length*2)+Math.min(8,money.length*2)+(contradiction.length*6));
    if(!t)return null;
    if(!issues.length)issues.push({title:'Явных триггеров скрининга не найдено',note:'Автоматический скрининг не обнаружил типовых сигналов из текущего набора правил.',why:'Это не подтверждает юридическую корректность документа.',fix:'Для важного договора используйте расширенный анализ.',weight:0});
    return {score,level:score>=72?'Внимание требуется':score>=55?'Есть пункты для проверки':'Базовая проверка',type:detectType(t),issues:[...issues,...contradiction].slice(0,9),dates:dates.slice(0,10),money:money.slice(0,10),emails:emails.slice(0,5),phones:phones.slice(0,5),chars:t.length};
  }

  function openAnalyze(){
    openSheet(`<h3 class="sheetTitle">Проверить документ</h3><p class="sheetSub">Файл обрабатывается прямо на устройстве в этой версии. Можно загрузить один или несколько документов; объединённый анализ добавим в следующем модуле backend.</p><div class="stack"><div class="upload"><div class="uploadIcon">⇧</div><b id="picked">Выберите документ</b><small>PDF · DOCX · TXT · JPG · PNG · WEBP · до 10 МБ</small><input id="fileInput" type="file" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp" multiple hidden><button class="pick" id="pick">Выбрать файл</button></div><textarea id="paste" class="field" placeholder="Или вставьте текст документа сюда…"></textarea><button class="wideBtn" id="run">Начать анализ</button><div id="status" class="status"></div><div class="notice">Важно: текущий анализ — автоматический скрининг по тексту документа. Для юридически значимого решения позже подключим отдельный защищённый AI-модуль.</div></div>`);
    const inp=document.getElementById('fileInput'),label=document.getElementById('picked'),status=document.getElementById('status');
    document.getElementById('pick').onclick=()=>inp.click();
    inp.onchange=e=>{state.selectedFile=e.target.files?.[0]||null;label.textContent=e.target.files?.length?`Выбрано файлов: ${e.target.files.length}`:'Выберите документ';if(e.target.files?.length>1)toast('В первой версии анализируем первый выбранный файл')};
    document.getElementById('run').onclick=async()=>{try{status.textContent='Подготавливаем анализ…';let text=document.getElementById('paste').value.trim(),name='Вставленный текст';if(state.selectedFile){name=state.selectedFile.name;text=await extract(state.selectedFile,status)}if(text.length<30)throw new Error('Нужно больше текста для анализа.');const r=analyze(text);state.currentReport=r;state.currentText=text;state.currentFileName=name;state.stats.checks++;addHistory({type:'analysis',name,score:r.score,issues:r.issues.length});renderReport(r,name)}catch(e){status.textContent=e.message||'Не удалось обработать документ.'}};
  }

  function renderReport(r,name){
    openSheet(`<h3 class="sheetTitle">Результат анализа</h3><p class="sheetSub">${esc(name)} · ${esc(r.type)}</p><div class="stack"><div class="resultHero"><div class="score"><strong>${r.score}</strong></div><div><b>${esc(r.level)}</b><p>${r.issues.length} пунктов для внимания · ${r.chars.toLocaleString('ru-RU')} символов</p></div></div>${r.issues.map(x=>`<div class="issue"><div class="issueHead"><span class="dot"></span><div><strong>${esc(x.title)}</strong><p>${esc(x.note)}</p><div class="fix"><b>Что делать:</b> ${esc(x.why||x.fix)}</div></div></div></div>`).join('')}<div class="result-card"><b>Извлечённые данные</b><p style="margin:6px 0 0;color:#9eb2ca;font-size:10.5px;line-height:1.5">${r.dates.length?'Даты: '+esc(r.dates.join(', '))+'<br>':''}${r.money.length?'Суммы: '+esc(r.money.join(', '))+'<br>':''}${r.emails.length?'Email: '+esc(r.emails.join(', '))+'<br>':''}${r.phones.length?'Телефоны: '+esc(r.phones.join(', ')):''}</p></div><button class="wideBtn" id="makeFixes">Предложить исправления</button><button class="ghostBtn" id="askDoc">Задать вопрос по документу</button><button class="ghostBtn" id="makeXray">Сделать юридический рентген</button><button class="ghostBtn" id="paidReview">Проверить у юриста</button><div class="legal-note">Информационный сервис. Результат автоматического скрининга не является юридическим заключением и не заменяет оценку специалиста с учётом обстоятельств дела.</div></div>`);
    document.getElementById('makeFixes').onclick=()=>openFixes(r,name);document.getElementById('askDoc').onclick=()=>openAI(r);document.getElementById('makeXray').onclick=()=>openXray(r,name);document.getElementById('paidReview').onclick=paid;
  }

  function openFixes(r,name){
    const selected=r.issues.filter(x=>x.weight>=1).slice(0,6);let chosen=new Set();
    openSheet(`<h3 class="sheetTitle">Исправления</h3><p class="sheetSub">Выберите пункты, по которым хотите увидеть предложенную формулировку.</p><div class="stack" id="fixList">${selected.map((x,i)=>`<button class="choice" data-fix="${i}"><b>${esc(x.title)}</b><span>${esc(x.fix)}</span></button>`).join('')}<button class="wideBtn" id="showFixes">Показать варианты</button></div>`);
    document.querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>{const i=b.dataset.fix;chosen.has(i)?chosen.delete(i):chosen.add(i);b.style.borderColor=chosen.has(i)?'rgba(90,212,255,.8)':'rgba(70,164,248,.2)'});
    document.getElementById('showFixes').onclick=()=>{const arr=selected.filter((_,i)=>chosen.size===0||chosen.has(String(i)));openSheet(`<h3 class="sheetTitle">Варианты формулировок</h3><p class="sheetSub">Примеры для дальнейшего редактирования, а не готовое юридическое заключение.</p><div class="stack">${arr.map(x=>`<div class="issue"><div class="issueHead"><span class="dot"></span><div><strong>${esc(x.title)}</strong><p>Исходная проблема: ${esc(x.note)}</p><div class="fix"><b>Вариант:</b> Стороны изменяют данное условие только по письменному соглашению, подписанному обеими сторонами.</div></div></div></div>`).join('')}<button class="wideBtn" id="createBased">Создать документ на основе проверки</button><button class="ghostBtn" id="paidFix">Передать юристу</button></div>`);document.getElementById('createBased').onclick=()=>openCreate('Претензия / предложение изменений');document.getElementById('paidFix').onclick=paid};
  }

  function openCreate(prefill=''){
    openSheet(`<h3 class="sheetTitle">Создать документ</h3><p class="sheetSub">Выберите задачу — потом зададим минимум необходимых вопросов.</p><div class="stack"><div class="choiceGrid">${[['Претензия продавцу','consumer'],['Заявление работодателю','work'],['Жалоба / обращение','complaint'],['Требование контрагенту','claim'],['Уведомление о расторжении','terminate'],['Другое','other']].map(([x,k])=>`<button class="choice" data-type="${k}"><b>${x}</b><span>Открыть конструктор</span></button>`).join('')}</div></div>`);
    document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>createForm(b.dataset.type,prefill));
  }
  const typeName={consumer:'Претензия продавцу',work:'Заявление работодателю',complaint:'Жалоба / обращение',claim:'Требование контрагенту',terminate:'Уведомление о расторжении',other:'Юридический документ'};
  function createForm(type,prefill){
    openSheet(`<h3 class="sheetTitle">${typeName[type]}</h3><p class="sheetSub">Шаг 1 из 2 · заполним факты, а не юридические термины.</p><div class="step"><i></i></div><div class="stack"><input id="who" class="field input" placeholder="Кому документ?" value=""><textarea id="situation" class="field" placeholder="Что произошло? Укажите даты, суммы и чего вы хотите добиться.">${esc(prefill)}</textarea><button class="wideBtn" id="next">Продолжить</button></div>`);
    document.getElementById('next').onclick=()=>{const who=document.getElementById('who').value.trim(),sit=document.getElementById('situation').value.trim();if(!who||sit.length<15){toast('Нужно заполнить адресата и ситуацию');return}buildDoc(type,who,sit)};
  }
  function buildDoc(type,who,sit){
    const date=new Date().toLocaleDateString('ru-RU');
    const title=typeName[type];
    const body=`${title.toUpperCase()}\n\nКому: ${who}\n\nУважаемые господа!\n\n${sit}\n\nНа основании изложенного прошу рассмотреть настоящее обращение и предоставить письменный ответ в установленный законом, договором или внутренними правилами срок. При необходимости готов предоставить дополнительные материалы.\n\nДата: ${date}\nПодпись: ____________________`;
    state.stats.docs++;state.lastCreated=body;addHistory({type:'document',name:title});
    openDocEditor(title,body);
  }
  function openDocEditor(title,initial){
    let body=initial;
    openSheet(`<h3 class="sheetTitle">Документ готов</h3><p class="sheetSub">Можно отредактировать и скачать. В следующем этапе подключим генерацию AI по каждому типу документа.</p><div class="stack"><textarea id="docEdit" class="field" style="min-height:290px;background:#fff;color:#15191f;font-family:Georgia,serif">${esc(body)}</textarea><button class="wideBtn" id="saveDoc">Сохранить изменения</button><button class="ghostBtn" id="txtBtn">Скачать TXT</button><button class="ghostBtn" id="wordBtn">Скачать Word (.doc)</button><button class="ghostBtn" id="paidDoc">Индивидуальная доработка юристом</button><div class="legal-note">Перед отправкой проверьте фактические данные, сроки, требования и адресата.</div></div>`);
    document.getElementById('saveDoc').onclick=()=>{body=document.getElementById('docEdit').value;state.lastCreated=body;toast('Изменения сохранены')};document.getElementById('txtBtn').onclick=()=>download(title+'.txt','text/plain;charset=utf-8',body);document.getElementById('wordBtn').onclick=()=>download(title+'.doc','application/msword;charset=utf-8','<html><meta charset="utf-8"><body style="font-family:Times New Roman;font-size:14pt">'+esc(body).replace(/\n/g,'<br>')+'</body></html>');document.getElementById('paidDoc').onclick=paid;
  }
  function download(name,type,data){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},800);toast('Файл подготовлен')}

  function openAI(report=null){
    const context=report?`Документ «${state.currentFileName}», тип: ${report.type}, индекс внимания: ${report.score}/100.`:'';
    openSheet(`<h3 class="sheetTitle">AI-консультант</h3><p class="sheetSub">${context||'Опишите ситуацию, а я помогу разложить её на факты, документы и следующие шаги.'}</p><div class="stack"><div class="chat" id="chat"><div class="bubble ai">Здравствуйте. Я ваш помощник. ${report?'Я вижу результаты скрининга документа.':'Расскажите, что произошло, обычными словами.'}</div></div><div class="chips"><button class="chip" data-q="Какие документы мне сохранить?">Какие документы сохранить?</button><button class="chip" data-q="Какие сроки проверить?">Какие сроки проверить?</button><button class="chip" data-q="Что делать дальше?">Что делать дальше?</button></div><div class="chatRow"><textarea id="chatInput" class="chatInput" placeholder="Напишите сообщение…"></textarea><button class="send" id="send">➤</button></div><div class="legal-note">Пока работает локальный помощник без внешнего API. Настоящий AI подключим через защищённый backend, чтобы ключи не попадали в приложение.</div></div>`);
    const chat=document.getElementById('chat'),input=document.getElementById('chatInput');
    const send=(q)=>{q=(q||input.value).trim();if(!q)return;chat.insertAdjacentHTML('beforeend','<div class="bubble me">'+esc(q)+'</div>');input.value='';const ans=localAnswer(q,report);chat.insertAdjacentHTML('beforeend','<div class="bubble ai">'+esc(ans)+'</div>');chat.scrollTop=chat.scrollHeight};
    document.getElementById('send').onclick=()=>send();input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>send(b.dataset.q));
  }
  function localAnswer(q,report){const t=q.toLowerCase();if(/документ|доказ|сохран/.test(t))return'Сохраните договоры, чеки, переписку, квитанции, фотографии, уведомления и подтверждения отправки. Оригиналы и даты лучше не удалять.';if(/срок|дата/.test(t))return'В первую очередь проверьте даты события, получения документа, срок оплаты и срок для направления ответа. Юридический срок зависит от типа ситуации и применимых норм.';if(/дальше|делать/.test(t))return report?'Начните с пунктов, которые отмечены как требующие внимания. Зафиксируйте документы и даты, после чего решите, нужен ли ответ второй стороне или консультация специалиста.':'Опишите событие, дату, сумму, участников и какой результат вы хотите получить. После этого можно подобрать документ или провести проверку файла.';if(/деньг|магазин|товар/.test(t))return'Соберите подтверждение покупки, переписку и отказ продавца. Затем можно сформировать претензию и проверить документы по делу.';if(/работ|увол|зарплат/.test(t))return'Сохраните документы работодателя, расчёт, переписку и даты. Не подписывайте новые документы, не проверив их содержание.';return'Разложите вопрос на четыре части: что произошло, когда, какие документы есть и чего вы хотите добиться. Пришлите документ — я смогу проверить его текст и отметить типовые пункты для внимания.'}

  function renderDocuments(){
    const rows=state.history.slice().reverse();
    view.innerHTML=`<div class="screen enter"><section class="section"><div class="head"><div><small>МОИ РЕЗУЛЬТАТЫ</small><h2>Документы и история</h2></div></div><div class="stack">${rows.length?rows.map((x,i)=>`<button class="choice" data-history="${i}"><b>${esc(x.name||'Документ')}</b><span>${x.type==='analysis'?'Анализ · индекс '+(x.score||'—')+'/100':'Созданный документ'} · ${new Date(x.at).toLocaleString('ru-RU')}</span></button>`).join(''):'<div class="notice">Пока здесь пусто. Проверьте документ или создайте первый текст.</div>'}<button class="ghostBtn" id="clearHist">Очистить историю</button></div></section></div>`;
    document.getElementById('clearHist').onclick=()=>{state.history=[];save();toast('История очищена');renderDocuments()};
  }
  function renderProfile(){
    view.innerHTML=`<div class="screen enter"><section class="section"><div class="head"><div><small>ПРОФИЛЬ</small><h2>Личный кабинет</h2></div></div><div class="profileCard"><div class="profileTop"><div class="bigAvatar">Д</div><div><b>Пользователь Telegram</b><span>Бесплатный тариф</span></div></div><div class="profileStats"><div><strong>${state.stats.checks}</strong><small>проверок</small></div><div><strong>${state.stats.docs}</strong><small>документов</small></div><div><strong>${state.stats.tests}</strong><small>тестов</small></div></div></div><div class="stack"><button class="choice" id="test"><b>◇ Юридические тесты</b><span>Проверьте знания и получите результат.</span></button><button class="choice" id="paid2"><b>♛ Платные услуги</b><span>Проверка и подготовка документов юристом.</span></button><button class="choice" id="about"><b>ⓘ О сервисе</b><span>Информационный помощник по правовым вопросам.</span></button></div><footer style="text-align:center;padding:25px 0 120px;color:#6684a7;font-size:9px">Made by <b style="color:#8ab8e6">kojenkov</b><div style="margin-top:7px">Право. Технологии. Твоя защита.</div></footer></section></div>`;
    document.getElementById('test').onclick=openTests;document.getElementById('paid2').onclick=paid;document.getElementById('about').onclick=()=>openSheet('<h3 class="sheetTitle">О сервисе</h3><p class="sheetSub">«Юрист объясняет | AI» — интерфейс юридического помощника. Автоматическая часть помогает ориентироваться в документах и готовить черновики; сложные случаи передаются специалисту.</p><div class="stack"><div class="notice">Версия MVP работает без собственного сервера: обработка загруженного текста выполняется на устройстве. Настоящий AI-backend подключим отдельно.</div><button class="ghostBtn" data-paid>Связаться с юристом</button></div>');
  }

  function openTests(){
    const questions=[['Перед подписанием договора полезнее всего','Проверить расторжение, ответственность и порядок изменения условий'],['Для претензии важно','Факты, даты, сумма требования и что именно вы просите'],['Если пришло требование об оплате','Сначала установить, кто его направил и что именно требует документ']];let i=0,score=0;
    openSheet('<h3 class="sheetTitle">Юридический тест</h3><p class="sheetSub">Три коротких вопроса.</p><div class="stack" id="testBox"></div>');const next=()=>{if(i>=questions.length){state.stats.tests++;save();document.getElementById('testBox').innerHTML='<div class="resultHero"><div class="score"><strong>'+score+'/'+questions.length+'</strong></div><div><b>Тест завершён</b><p>Попробуйте ещё раз после изучения новых тем.</p></div></div><button class="wideBtn" id="again">Пройти снова</button>';document.getElementById('again').onclick=openTests;return}const q=questions[i];document.getElementById('testBox').innerHTML='<div class="result-card"><b>Вопрос '+(i+1)+' из '+questions.length+'</b><p>'+esc(q[0])+'</p></div><button class="choice" id="good"><b>'+esc(q[1])+'</b><span>Выбрать</span></button><button class="choice" id="bad"><b>Сразу подписать и не читать</b><span>Выбрать</span></button>';document.getElementById('good').onclick=()=>{score++;i++;next()};document.getElementById('bad').onclick=()=>{i++;next()}};next()
  }

  function openXray(r,name){
    if(!r){openSheet('<h3 class="sheetTitle">Юридический рентген</h3><p class="sheetSub">Сначала загрузите документ и проведите проверку.</p><div class="stack"><button class="wideBtn" id="startX">Проверить документ</button></div>');document.getElementById('startX').onclick=openAnalyze;return}
    const high=r.issues.filter(x=>x.weight>=2).length,mid=Math.max(0,r.issues.length-high);
    const shareText='⚖️ Юридический рентген\n'+(name||'Документ')+'\nИндекс внимания: '+r.score+'/100\nСерьёзных пунктов: '+high+'\nДополнительных: '+mid+'\n\nЮрист объясняет | AI';
    openSheet('<h3 class="sheetTitle">Юридический рентген</h3><p class="sheetSub">'+esc(name||'Документ')+'</p><div class="stack"><div class="xrayCard"><div class="xrayLabel">ИНДЕКС ВНИМАНИЯ</div><div class="xrayBig">'+r.score+'<span style="font-size:14px;color:#79a4ca">/100</span></div><div style="margin-top:8px;color:#a9bed8;font-size:10px">'+high+' серьёзных пунктов · '+mid+' дополнительных</div></div><div class="notice">Карточка рассчитана на быстрый просмотр. Это не оценка законности документа.</div><div class="shareRow"><button class="wideBtn" id="share">Поделиться</button><button class="ghostBtn" id="copy">Скопировать</button></div></div>');
    document.getElementById('copy').onclick=()=>navigator.clipboard?.writeText(shareText).then(()=>toast('Текст скопирован')).catch(()=>toast('Не удалось скопировать'));document.getElementById('share').onclick=async()=>{if(navigator.share){try{await navigator.share({title:'Юридический рентген',text:shareText,url:'https://kojenkovd.github.io/yurist-explains-ai/'})}catch(_){}}else if(tg?.openTelegramLink){tg.openTelegramLink('https://t.me/share/url?url=https://kojenkovd.github.io/yurist-explains-ai/&text='+encodeURIComponent(shareText))}else{await navigator.clipboard?.writeText(shareText);toast('Результат скопирован')}};
  }

  state.screen='home';renderHome();updateStats();
  function updateStats(){
    // На домашнем экране статистика не нужна; состояние хранится для профиля.
  }
})();
