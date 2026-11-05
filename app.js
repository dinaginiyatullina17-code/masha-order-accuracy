(() => {
  'use strict';
  const questions = window.TRAINER_CONTENT.questions;
  const KEY = 'masha-accuracy-v1';
  const app = document.getElementById('app');
  let state = { answers: {}, current: 0, started: false, finished: false, revision: 'expert-2026-11-05' };
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved.answers === 'object' && saved.answers !== null) {
      state = { ...state, started: !!saved.started, finished: !!saved.finished,
        current: Number.isInteger(saved.current) ? Math.max(0, Math.min(questions.length - 1, (saved.revision === 'expert-2026-11-05' || saved.current < 13 ? saved.current : saved.current - 1))) : 0,
        answers: Object.fromEntries(Object.entries(saved.answers).filter(([id, answer]) => questions.some(q => q.id === id && q.choices.some(c => c.id === answer)))) };
      if (Object.keys(state.answers).length !== questions.length) state.finished = false;
    }
  } catch { storageAvailable = false; }
  let selected = null;
  const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const paras = lines => lines.map(p => `<p>${escape(p)}</p>`).join('');
  const answerFor = q => q.choices.find(c => c.id === state.answers[q.id]);
  const completed = () => Object.keys(state.answers).length;
  const correctCount = () => questions.filter(q => answerFor(q)?.correct).length;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { storageAvailable = false; } }
  function top() { window.scrollTo({ top: 0, behavior: 'instant' }); }
  function focusHeading() { const heading = app.querySelector('h1,h2'); if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); } }
  const instruction = `<h3>Инструкция</h3><p>Когда сотрудники готовят и собирают заказ, твоя задача, как управляющего сменой — контролировать этот процесс и его исполнение.</p><p>Внимательно изучи предложенные ситуации, выбери одно из предложенных действий и изучи пояснение — в нём разбор причин и правильный алгоритм действий на будущее.</p><p><b>Твоя задача — оценить корректность и аккуратность сборки.</b></p>`;
  const impact = 'Твои действия влияют на точность сборки заказов и на то, повторяется ли одна и та же ошибка.';
  function home() {
    const hasProgress = completed() > 0;
    const situations = new Set(questions.map(q => q.title.match(/\d+/)[0])).size;
    app.innerHTML = `<section class="hero"><div><span class="eyebrow">ПРАКТИКА ДЛЯ УПРАВЛЯЮЩЕГО СМЕНОЙ</span><h1>Точность сборки.<br><em>Всё начинается<br>с твоих решений.</em></h1><p class="lead">Замечай ошибки вовремя, помогай команде и сохраняй доверие Гостей.</p><div class="meta"><span><strong>${situations}</strong>ситуаций</span><span><strong>15</strong>минут</span></div></div><div class="hero-art"><img src="assets/masha.png" alt="Маша — проводник по тренажёру"><div class="art-tag"><strong>Точность — твоя зона ответственности</strong>${impact}</div></div></section><section class="intro-bottom"><div><h3>Для кого этот тренажёр</h3><p>Для тех, кто только стал управляющим сменой, а также для тех, кто хочет освежить знания и проверить себя в нестандартных ситуациях.</p></div><div><h3>Ты научишься</h3><p>Не просто проверять сборку заказов, а управлять корректностью сборки на каждом этапе. Это поможет тебе предотвращать ошибки до того, как Гость столкнётся с негативным опытом посещения ресторана.</p></div></section><section class="intro-instruction" aria-label="Инструкция к тренажёру">${instruction}</section><div class="start-area"><button class="primary" id="start">${state.finished ? 'Посмотреть результат' : hasProgress ? 'Продолжить тренажёр' : 'Начать тренажёр'} <span aria-hidden="true">→</span></button>${hasProgress ? '<button class="quiet" id="restart">Начать заново</button>' : ''}${hasProgress ? `<p class="save-status">Сохранено ответов: ${completed()} из ${questions.length}</p>` : ''}</div>`;
    document.getElementById('start').onclick = () => { state.started = true; save(); if (state.finished) result(); else task(); top(); focusHeading(); };
    document.getElementById('restart')?.addEventListener('click', resetPrompt);
  }
  function mediaFrame(src, rotation, alt) {
    return `<span class="photo-frame ${rotation ? 'rotated' : ''}" data-rotation="${rotation}"><img src="${escape(src)}" alt="${escape(alt)}"></span>`;
  }
  function sizeFrames(root) {
    root.querySelectorAll('.photo-frame').forEach(frame => {
      const image = frame.querySelector('img');
      const update = () => {
        const rotation = Number(frame.dataset.rotation);
        const ratio = rotation ? image.naturalHeight / image.naturalWidth : image.naturalWidth / image.naturalHeight;
        if (!Number.isFinite(ratio) || ratio <= 0) return;
        frame.style.setProperty('--photo-aspect', ratio);
        if(rotation) {
          image.style.width = (100 / ratio) + '%';
          image.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        }
      };
      image.addEventListener('load', update, {once:true});
      if(image.complete) update();
    });
  }
  function task() {
    const q = questions[state.current];
    const answer = answerFor(q);
    selected = answer?.id || null;
    app.innerHTML = `<div class="workspace"><aside class="sidebar" aria-label="Прогресс прохождения"><div class="sidebar-title">ТВОЯ ПРАКТИКА</div><div class="progress-line" role="progressbar" aria-label="Пройдено заданий" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${completed()}"><span style="width:${completed()/questions.length*100}%"></span></div><div class="progress-label">${completed()} из ${questions.length} решений</div><nav class="steps">${questions.map((item, i) => {const a = answerFor(item); return `<button class="step ${i === state.current ? 'active' : ''} ${a ? a.correct ? 'done' : 'wrong' : ''}" data-task="${i}" ${i===state.current ? 'aria-current="step"' : ''} aria-label="${escape(item.title)}${a ? a.correct ? ', верно' : ', есть ошибка' : ''}"><b>${a ? a.correct ? '✓' : '·' : String(i+1).padStart(2,'0')}</b><span>${escape(item.title.replace('Ситуация ', '').replace(' – Продолжение',' · продолжение'))}</span></button>`;}).join('')}</nav><button class="quiet" id="restart">Начать заново ↺</button></aside><section class="task-content"><div class="task-head"><span class="eyebrow">НАБЛЮДАЙ · ОЦЕНИВАЙ · ДЕЙСТВУЙ</span><span>Решение ${state.current+1} / ${questions.length}</span></div><h2>${escape(q.title)}</h2><div class="scenario ${q.images.length ? '' : 'no-image'}"><div class="story">${paras(q.body)}</div>${q.images.length ? `<div class="pictures ${q.images.length > 1 ? 'multiple' : ''}">${q.images.map((src,i)=>`<button class="photo" data-photo="${escape(src)}" data-rotation="${q.imageRotations?.[src] || 0}" aria-label="Увеличить изображение ${i+1}: ${escape(q.title)}">${mediaFrame(src, q.imageRotations?.[src] || 0, q.title + ', изображение ' + (i+1))}<span>Увеличить ↗</span></button>`).join('')}</div>` : ''}</div><div class="choices-label">ВЫБЕРИ ОДНО ДЕЙСТВИЕ</div><div class="choices" role="group" aria-label="Варианты действий">${q.choices.map((c,i)=>`<button class="choice ${answer ? c.correct ? 'correct' : c.id===answer.id ? 'incorrect' : '' : ''}" data-choice="${c.id}" aria-pressed="${answer?.id===c.id}" ${answer?'disabled':''}><span class="circle" aria-hidden="true">${answer && c.correct ? '✓' : answer?.id===c.id ? '×' : String.fromCharCode(1040+i)}</span><span>${escape(c.text)}</span></button>`).join('')}</div><div id="response"></div><div class="actions"><span class="hint">${answer ? 'Изучи пояснение и переходи к следующей ситуации.' : 'Сначала выбери действие, затем проверь решение.'}</span><button class="primary" id="check" ${answer ? '' : 'disabled'}>${answer ? state.current === questions.length-1 ? completed()===questions.length ? 'К результату →' : 'К пропущенному заданию →' : 'Следующее решение →' : 'Проверить решение →'}</button></div><p class="save-status">${storageAvailable ? 'Прогресс сохраняется в этом браузере.' : 'Сохранение недоступно. Пройди тренажёр, не закрывая вкладку.'}</p></section></div>`;
    app.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>{state.current=Number(b.dataset.task);save();task();top();focusHeading();});
    sizeFrames(app);
    app.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{
      const dialog=document.getElementById('photoDialog');
      dialog.querySelector('.photo-content').innerHTML=mediaFrame(b.dataset.photo, Number(b.dataset.rotation), 'Изображение ситуации в полном размере');
      sizeFrames(dialog);dialog.showModal();
    });
    app.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
      selected=b.dataset.choice;
      app.querySelectorAll('[data-choice]').forEach(item=>{item.classList.toggle('selected',item===b);item.setAttribute('aria-pressed',String(item===b));});
      document.getElementById('check').disabled=false;
    });
    document.getElementById('restart').onclick=resetPrompt;
    document.getElementById('check').onclick=()=>{
      if (answerFor(q)) {
        if (state.current < questions.length-1) {state.current++;save();task();}
        else if(completed()===questions.length){state.finished=true;save();result();}
        else {state.current=questions.findIndex(item=>!answerFor(item));save();task();}
        top();focusHeading();
      } else if(selected) {
        state.answers[q.id]=selected;save();task();
        const response=document.getElementById('feedback');response.scrollIntoView({behavior:'smooth',block:'start'});response.focus({preventScroll:true});
      }
    };
    if(answer) renderFeedback(q,answer);
  }
  function renderFeedback(q,answer){
    const correct=q.choices.find(c=>c.correct);
    document.getElementById('response').innerHTML=`<section class="feedback ${answer.correct?'':'bad'}" id="feedback" tabindex="-1" aria-label="Разбор решения"><div class="feedback-layout"><div class="feedback-copy"><h3>${answer.correct?'Правильный ответ!':'Неверно.'}</h3>${paras(answer.feedback.filter((p,i)=>i!==0 || !/^(Неверно|Правильный ответ)/i.test(p)))}</div><figure class="feedback-character"><img src="${escape(answer.character)}" alt="${answer.correct?'Маша радуется верному решению':'Маша обдумывает неверное решение'}"></figure></div>${!answer.correct?`<details open><summary>Правильное действие и разбор</summary><div>${paras(correct.feedback.filter((p,i)=>i!==0 || !/^Правильный ответ/i.test(p)))}</div></details>`:''}</section>`;
  }
  function result(){
    const score=correctCount();
    app.innerHTML=`<section class="result"><div class="result-top"><div><span class="eyebrow">ПРАКТИКА ЗАВЕРШЕНА</span><h1>Поздравляю<br>с прохождением задания!</h1><p>Точность сборки — зона ответственности управляющего. ${impact}</p><div class="score"><div><strong>${score} / ${questions.length}</strong><span>верных решений</span></div><div><strong>${Math.round(score/questions.length*100)}%</strong><span>результат</span></div></div><p><b>Принимай решения, а не констатируй ошибки.</b></p></div><div class="result-art"><img src="assets/masha.png" alt="Маша поздравляет с завершением тренажёра"></div></div><div class="actions"><button class="primary" id="reviewMistakes">${score<questions.length?'Разобрать ошибки':'Повторить разборы'} →</button><button class="secondary" id="restart">Пройти ещё раз ↺</button></div><div class="review" id="review"><h2>Твои решения</h2>${questions.map((q,i)=>{const a=answerFor(q), c=q.choices.find(c=>c.correct);return `<details data-review="${i}"><summary>${escape(q.title)}<span class="status">${a?.correct?'✓ Верно':'· Ошибка'}</span></summary><div class="review-body">${paras(q.body)}<p><b>Твоё действие:</b> ${escape(a?.text||'Ответ не дан')}</p>${a&&!a.correct?paras(a.feedback):''}<p><b>Правильное действие:</b> ${escape(c.text)}</p>${paras(c.feedback)}</div></details>`;}).join('')}</div><div class="finish-area"><button class="primary finish-button" id="finish">Завершить тренажёр</button></div></section>`;
    document.getElementById('restart').onclick=resetPrompt;
    document.getElementById('finish').onclick=()=>{home();top();focusHeading();};
    document.getElementById('reviewMistakes').onclick=()=>{
      let first=null;app.querySelectorAll('[data-review]').forEach(el=>{const q=questions[Number(el.dataset.review)];el.open=score===questions.length||!answerFor(q)?.correct;if(el.open&&!first)first=el;});
      (first||document.getElementById('review')).scrollIntoView({behavior:'smooth',block:'start'});
    };
  }
  function resetPrompt(){document.getElementById('resetDialog').showModal();}
  document.getElementById('home').onclick=e=>{e.preventDefault();home();top();focusHeading();};
  document.getElementById('guide').onclick=()=>{document.getElementById('guideContent').innerHTML=instruction;document.getElementById('guideDialog').showModal();};
  document.querySelectorAll('dialog .close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  document.querySelectorAll('dialog').forEach(d=>d.onclick=e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
  document.getElementById('cancelReset').onclick=()=>document.getElementById('resetDialog').close();
  document.getElementById('confirmReset').onclick=()=>{state={answers:{},current:0,started:true,finished:false,revision:'expert-2026-11-05'};save();document.getElementById('resetDialog').close();task();top();focusHeading();};
  home();
})();
