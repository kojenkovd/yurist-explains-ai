(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    try { tg.setHeaderColor('#041331'); tg.setBackgroundColor('#03102a'); } catch (_) {}
  }

  // Replace this with your real Telegram username for paid services.
  const PAID_TELEGRAM = 'CHANGE_ME';

  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');
  let toastTimer;

  const paidUrl = () => PAID_TELEGRAM === 'CHANGE_ME' ? null : `https://t.me/${PAID_TELEGRAM.replace(/^@/, '')}`;

  function toast(message) {
    let node = document.querySelector('.toast');
    if (!node) { node = document.createElement('div'); node.className = 'toast'; document.body.appendChild(node); }
    node.textContent = message; node.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2200);
  }

  function closeModal() {
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); content.innerHTML = '';
  }

  function openModal(inner) {
    content.innerHTML = inner;
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
  }

  const escapeHTML = (s='') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function analyzeText(text, fileName='текст') {
    const t = text.replace(/\s+/g, ' ').trim();
    const rules = [
      { key:'односторон', title:'Одностороннее изменение условий', note:'Проверьте формулировки о праве одной стороны менять цену, сроки или другие существенные условия без согласования.', weight:3 },
      { key:'штраф|неустойк|пен', title:'Штрафы и неустойки', note:'Проверьте размер санкций, условия их начисления и порядок прекращения обязательств.', weight:2 },
      { key:'автоматическ.*продл|пролонгац', title:'Автопродление', note:'Есть указание на автоматическое продление. Обратите внимание на срок уведомления об отказе.', weight:2 },
      { key:'предоплат|аванс|задаток', title:'Предоплата / аванс', note:'Проверьте условия возврата, удержания суммы и основания для удержания.', weight:2 },
      { key:'персональн.*данн|152-фз', title:'Персональные данные', note:'Проверьте, какие данные передаются, кому и на какой срок.', weight:1 },
      { key:'подсудн|арбитраж|суд', title:'Порядок разрешения споров', note:'Проверьте, какой суд и порядок обращения указан в документе.', weight:1 },
      { key:'расторжен|отказ.*от', title:'Расторжение / отказ', note:'Проверьте основания, сроки уведомления и финансовые последствия прекращения договора.', weight:2 },
      { key:'ответственност', title:'Ответственность сторон', note:'Посмотрите, симметричны ли обязательства сторон и ограничена ли ответственность.', weight:1 }
    ];
    const found = [];
    for (const r of rules) {
      const re = new RegExp(r.key, 'iu');
      if (re.test(t)) found.push(r);
    }
    const dates = t.match(/\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/g) || [];
    const money = t.match(/\b\d[\d\s]*(?:₽|руб(?:\.|лей)?)\b/giu) || [];
    const score = Math.min(100, 38 + found.reduce((a,r)=>a+r.weight*7,0) + (dates.length ? 5 : 0) + (money.length ? 5 : 0));
    const level = score >= 72 ? 'Высокое внимание' : score >= 55 ? 'Есть что проверить' : 'Базовая проверка';
    const issues = found.length ? found.slice(0,6) : [{title:'Явных триггеров не найдено',note:'Автоматический скрининг не заменяет проверку юристом и не подтверждает юридическую корректность документа.',weight:0}];
    return { fileName, length:t.length, score, level, issues, dates: dates.slice(0,6), money: money.slice(0,6) };
  }

  function renderReport(report) {
    openModal(`
      <h3 class="modal-title">Результат проверки</h3>
      <p class="modal-sub">Файл: <b>${escapeHTML(report.fileName)}</b></p>
      <div class="result">
        <div class="result-card">
          <div class="risk-row"><span class="risk-dot risk-high"></span><div><b>${escapeHTML(report.level)}</b><p>Индекс внимания: <b>${report.score}/100</b>. Это предварительный автоматический скрининг, а не юридическое заключение.</p></div></div>
        </div>
        ${report.issues.map(x => `<div class="result-card"><div class="risk-row"><span class="risk-dot ${x.weight>=2?'risk-high':'risk-mid'}"></span><div><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.note)}</p></div></div></div>`).join('')}
        ${(report.dates.length||report.money.length) ? `<div class="result-card"><b>Что ещё найдено</b><p>${report.dates.length ? `Даты: ${escapeHTML(report.dates.join(', '))}. ` : ''}${report.money.length ? `Суммы: ${escapeHTML(report.money.join(', '))}.` : ''}</p></div>`:''}
      </div>
      <button class="action-wide" id="paidReview">Получить проверку юристом</button>
      <div class="legal-note">Сервис помогает ориентироваться в документе. Перед подписанием или подачей в суд документы по важным вопросам стоит проверить специалистом с учётом всех обстоятельств.</div>
    `);
    document.getElementById('paidReview')?.addEventListener('click', goPaid);
  }

  async function extractFile(file) {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'txt') return await file.text();
    if (ext === 'docx') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js');
      const buf = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({arrayBuffer:buf});
      return result.value || '';
    }
    if (['png','jpg','jpeg','webp'].includes(ext)) {
      await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
      const { data } = await window.Tesseract.recognize(file, 'rus+eng', { logger: m => { if (m.status && m.progress) { const node=document.getElementById('analysisStatus'); if(node) node.textContent = `Распознаём фото: ${Math.round(m.progress*100)}%`; } } });
      return data.text || '';
    }
    if (ext === 'pdf') {
      if (!window.pdfjsLib) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      const pdfjs = window.pdfjsLib;
      if (!pdfjs) throw new Error('PDF engine unavailable');
      const pdf = await pdfjs.getDocument({data: await file.arrayBuffer()}).promise;
      let out='';
      for (let i=1;i<=Math.min(pdf.numPages,15);i++) {
        const page=await pdf.getPage(i); const c=await page.getTextContent();
        out += c.items.map(x=>x.str).join(' ')+'\n';
      }
      return out;
    }
    throw new Error('Поддерживаются PDF, DOCX, TXT, JPG, JPEG, PNG и WEBP.');
  }

  function loadScript(src, module=false) {
    return new Promise((resolve,reject)=>{
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) return resolve();
      const s=document.createElement('script'); s.src=src; s.async=true; if(module) s.type='module';
      s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
    });
  }

  function openAnalyze() {
    openModal(`
      <h3 class="modal-title">Анализ документа</h3>
      <p class="modal-sub">Загрузите PDF, DOCX или TXT. Первая версия уже умеет извлекать текст и делать предварительный юридический скрининг прямо в браузере.</p>
      <div class="modal-grid">
        <div class="upload-box"><div class="big">⇧</div><b>Загрузите документ</b><small>до 10 МБ • PDF / DOCX / TXT / фото</small><input id="fileInput" type="file" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp" hidden><button class="file-btn" id="pickFile">Выбрать файл</button></div>
        <textarea class="textarea" id="pasteText" placeholder="Или вставьте сюда текст документа..."></textarea>
        <button class="action-wide" id="startAnalysis">Начать анализ</button>
        <div id="analysisStatus" class="legal-note"></div>
      </div>
    `);
    let selected=null;
    const input=document.getElementById('fileInput');
    document.getElementById('pickFile').onclick=()=>input.click();
    input.onchange=e=>{selected=e.target.files?.[0]||null; document.getElementById('analysisStatus').textContent=selected?`Выбран файл: ${selected.name}`:''};
    document.getElementById('startAnalysis').onclick=async()=>{
      const status=document.getElementById('analysisStatus'); status.textContent='Обрабатываем документ…';
      try{
        let text=document.getElementById('pasteText').value;
        let name='вставленный текст';
        if(selected){ name=selected.name; text=await extractFile(selected); }
        if(!text.trim()) throw new Error('Загрузите файл или вставьте текст.');
        renderReport(analyzeText(text,name));
      }catch(err){ status.textContent=err.message||'Не удалось обработать документ.'; }
    };
  }

  function openCreate() {
    openModal(`<h3 class="modal-title">Создать документ</h3><p class="modal-sub">Выберите тип документа и опишите ситуацию. Сейчас работаем в режиме конструктора; подключение генерации AI сделаем следующим этапом.</p><div class="modal-grid"><button class="service-card" data-create-type="Претензия продавцу"><div class="service-icon">✎</div><div class="service-content"><b>Претензия продавцу</b><span>Возврат денег, недостатки товара, отказ в обслуживании.</span></div></button><button class="service-card" data-create-type="Заявление работодателю"><div class="service-icon">▤</div><div class="service-content"><b>Заявление работодателю</b><span>Зарплата, отпуск, документы, трудовые вопросы.</span></div></button><button class="service-card" data-create-type="Жалоба в госорган"><div class="service-icon">⚖</div><div class="service-content"><b>Жалоба / обращение</b><span>Опишите проблему — сформируем структуру текста.</span></div></button></div>`);
    document.querySelectorAll('[data-create-type]').forEach(b=>b.onclick=()=>openCreateForm(b.dataset.createType));
  }
  function openCreateForm(type){
    openModal(`<h3 class="modal-title">${escapeHTML(type)}</h3><p class="modal-sub">Коротко опишите ситуацию, укажите даты, суммы и что вы уже предпринимали.</p><textarea class="textarea" id="createText" placeholder="Например: 12 августа купил товар…"></textarea><button class="action-wide" id="buildDoc">Сформировать проект</button><div id="docResult"></div>`);
    document.getElementById('buildDoc').onclick=()=>{
      const t=document.getElementById('createText').value.trim();
      if(!t) return toast('Сначала опишите ситуацию');
      document.getElementById('docResult').innerHTML=`<div class="result"><div class="result-card"><b>Проект создан</b><p>Тип: ${escapeHTML(type)}. Суть: ${escapeHTML(t.slice(0,260))}${t.length>260?'…':''}</p></div><button class="action-wide" id="docPaid">Заказать индивидуальную доработку</button></div>`;
      document.getElementById('docPaid').onclick=goPaid;
    };
  }

  function openAsk(){
    openModal(`<h3 class="modal-title">Спросить AI</h3><p class="modal-sub">Опишите ситуацию обычными словами. В этой версии ответ формируется из ваших данных; подключение внешнего AI будет следующим этапом.</p><textarea class="textarea" id="askText" placeholder="Что произошло?"></textarea><button class="action-wide" id="askRun">Получить разбор</button><div id="askResult"></div>`);
    document.getElementById('askRun').onclick=()=>{
      const t=document.getElementById('askText').value.trim(); if(!t) return toast('Опишите ситуацию');
      const r=analyzeText(t,'описание ситуации');
      document.getElementById('askResult').innerHTML=`<div class="result"><div class="result-card"><b>Что стоит сделать дальше</b><p>Зафиксируйте документы и даты, сохраните переписку и отдельно проверьте пункты, которые приложение отметило как требующие внимания.</p></div>${r.issues.slice(0,3).map(x=>`<div class="result-card"><b>${escapeHTML(x.title)}</b><p>${escapeHTML(x.note)}</p></div>`).join('')}<button class="action-wide" id="askPaid">Получить консультацию юриста</button></div>`;
      document.getElementById('askPaid').onclick=goPaid;
    };
  }

  function openXray(){
    openModal(`<h3 class="modal-title">Юридический рентген</h3><p class="modal-sub">Загрузите документ — после проверки можно будет сделать яркую карточку с результатом и поделиться ею в Telegram.</p><div class="xray-banner glass" style="margin-top:15px"><div><div class="section-kicker">ДЕМО</div><h3 style="margin:5px 0">3 пункта требуют внимания</h3><p>Скоро здесь появится настоящий отчёт с вашим документом.</p></div><div class="xray-orb">✦</div></div><button class="action-wide" id="xrayStart">Проверить документ</button>`);
    document.getElementById('xrayStart').onclick=openAnalyze;
  }

  function goPaid(){
    const url=paidUrl();
    if(!url){ toast('Нужно указать ваш Telegram username в app.js'); return; }
    window.open(url,'_blank','noopener');
  }

  document.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',()=>{
    const key=el.dataset.open; if(key==='analyze')openAnalyze(); if(key==='create')openCreate(); if(key==='ask')openAsk(); if(key==='xray')openXray();
  }));
  document.querySelectorAll('[data-paid-link]').forEach(a=>a.addEventListener('click',e=>{
    if(!paidUrl()){e.preventDefault(); toast('Сейчас ссылка-заглушка. Потом поставим ваш Telegram.');}
  }));
  document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeModal));

  document.querySelectorAll('[data-nav]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active')); btn.classList.add('active');
    const nav=btn.dataset.nav;
    if(nav==='home') window.scrollTo({top:0,behavior:'smooth'});
    else if(nav==='docs') openAnalyze();
    else if(nav==='ai') openAsk();
    else if(nav==='tests') toast('Тесты подключим следующим модулем');
    else if(nav==='profile') openModal(`<h3 class="modal-title">Профиль</h3><p class="modal-sub">Здесь будет история проверок, документы, избранное и Premium.</p><button class="action-wide" id="profilePaid">Платные услуги</button>`), document.getElementById('profilePaid').onclick=goPaid;
  }));
})();
