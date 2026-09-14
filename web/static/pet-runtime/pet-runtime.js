/* 黑松克桌宠 Web Runtime（可直接嵌入 logic-coloc 等主体项目） */
(function (global) {
  "use strict";
  const ACTIONS = {
    normal:{frames:9,priority:0}, wave:{frames:12,priority:10}, idea:{frames:12,priority:30},
    followup:{frames:16,priority:40}, crosslink:{frames:16,priority:50}, savecard:{frames:18,priority:60},
    mastered:{frames:16,priority:70}, forgotten:{frames:16,priority:70}, newnote:{frames:16,priority:60},
    newbook:{frames:15,priority:60}, lv2:{frames:16,priority:100}, lv3:{frames:16,priority:100},
    lv4:{frames:16,priority:100}, lv5:{frames:16,priority:100}
  };
  const EVENTS = {
    "app.returned":"wave", "app.idle":"normal", "knowledge.explain.completed":"idea",
    "knowledge.followup.milestone":"followup", "knowledge.crosslink.found":"crosslink",
    "card.created":"savecard", "note.created":"newnote", "book.created":"newbook",
    "review.mastered":"mastered", "review.vague":"forgotten", "review.forgotten":"forgotten",
    "level.changed.lv2":"lv2", "level.changed.lv3":"lv3", "level.changed.lv4":"lv4", "level.changed.lv5":"lv5"
  };
  const labels = {normal:"待机",wave:"挥手打招呼",idea:"灵感时刻",followup:"深入追问",crosslink:"发现同源",savecard:"存为知识卡片",mastered:"复习掌握",forgotten:"复习遗忘/模糊",newnote:"新建笔记",newbook:"整理书架",lv2:"升级 Lv.2",lv3:"升级 Lv.3",lv4:"升级 Lv.4",lv5:"升级 Lv.5"};

  function create(options) {
    options = Object.assign({container:document.body, assetBase:"assets", size:120, draggable:true, idleAfter:180000, storageKey:"heisongke-pet-position-v1"}, options);
    const root = document.createElement("div"); root.className = "heisongke-pet";
    const image = document.createElement("img"); image.alt = "看山"; image.draggable = false; root.appendChild(image); options.container.appendChild(root);
    let current = null, queue = [], timer = 0, idleTimer = 0, destroyed = false, dragging = false, down = null;
    let pos = loadPosition();
    root.style.width = `${options.size}px`; root.style.height = `${options.size}px`; applyPosition();
    function assetAction(action) { return /^lv[2-5]$/.test(action) ? "levelup" : action; }
    function path(action, i, ext) { const folder=assetAction(action); const filename=folder === "levelup" ? `levelup_${i + 1}` : `${folder}_${i + 1}`; return `${options.assetBase}/${folder}/${filename}.${ext}`; }
    function loadPosition() { try { const p=JSON.parse(localStorage.getItem(options.storageKey)); if (p && Number.isFinite(p.xRatio)) return p; } catch (_) {} return {xRatio:.82,yRatio:.72}; }
    function savePosition() { try { localStorage.setItem(options.storageKey, JSON.stringify(pos)); } catch (_) {} }
    function applyPosition() { const maxX=Math.max(0,innerWidth-root.offsetWidth), maxY=Math.max(0,innerHeight-root.offsetHeight); root.style.left=`${Math.max(0,Math.min(maxX,pos.xRatio*innerWidth))}px`; root.style.top=`${Math.max(0,Math.min(maxY,pos.yRatio*innerHeight))}px`; }
    function setFrame(action, i) { const cfg=ACTIONS[action]; if (!cfg) return; image.onerror=function(){ if (image.dataset.fallback !== "1") { image.dataset.fallback="1"; image.src=path(action,i,"png"); } else if (action !== "normal") { image.onerror=null; image.src=path("normal",0,"png"); } }; image.dataset.fallback="0"; image.src=path(action,i,"webp"); image.alt=`看山：${labels[action]||action}`; root.dataset.action=action; }
    function finish() { timer=0; current=null; const next=queue.shift(); if (next) play(next.action,next.detail); else setFrame("normal",0); }
    function play(action, detail) { if (destroyed || !ACTIONS[action]) return false; if (action !== "normal" && current && ACTIONS[action].priority < ACTIONS[current].priority) { queue.push({action,detail}); return true; } if (timer) clearTimeout(timer); current=action; setFrame(action,0); if (action === "normal") return true; let i=0; const tick=()=>{ if(dragging) { timer=setTimeout(tick,120); return; } i++; if(i>=ACTIONS[action].frames){finish();return;} setFrame(action,i); timer=setTimeout(tick,120); }; timer=setTimeout(tick,120); return true; }
    function trigger(action, detail) { if (action === "normal" && current && current !== "normal") return {accepted:true,queued:false,action:"normal"}; const queued=Boolean(current && current !== "normal" && ACTIONS[action].priority < ACTIONS[current].priority); play(action,detail); return {accepted:true,queued,action}; }
    function emit(event, detail) { const action=EVENTS[event] || event; return trigger(action, Object.assign({event},detail||{})); }
    function resetIdle() { clearTimeout(idleTimer); idleTimer=setTimeout(()=>{ if(!current || current === "normal") play("normal"); }, options.idleAfter); }
    function pointerDown(e) { if (!options.draggable) return; dragging=false; down={x:e.clientX,y:e.clientY,left:root.offsetLeft,top:root.offsetTop}; root.setPointerCapture?.(e.pointerId); }
    function pointerMove(e) { if (!down) return; if (!dragging && Math.hypot(e.clientX-down.x,e.clientY-down.y)>8) { dragging=true; root.classList.add("is-dragging"); } if (!dragging) return; const x=Math.max(0,Math.min(innerWidth-root.offsetWidth,down.left+e.clientX-down.x)), y=Math.max(0,Math.min(innerHeight-root.offsetHeight,down.top+e.clientY-down.y)); root.style.left=`${x}px`; root.style.top=`${y}px`; pos={xRatio:innerWidth?x/innerWidth:0,yRatio:innerHeight?y/innerHeight:0}; }
    function pointerUp() { if (!down) return; if (dragging) savePosition(); down=null; root.classList.remove("is-dragging"); dragging=false; resetIdle(); }
    root.addEventListener("pointerdown",pointerDown); root.addEventListener("pointermove",pointerMove); root.addEventListener("pointerup",pointerUp); root.addEventListener("pointercancel",pointerUp); addEventListener("resize",applyPosition); ["pointerdown","keydown","scroll"].forEach(t=>addEventListener(t,resetIdle,{passive:true}));
    resetIdle(); play("normal");
    return {root, trigger, emit, show:()=>root.hidden=false, hide:()=>root.hidden=true, moveTo(p){pos={xRatio:Math.max(0,Math.min(1,p.xRatio)),yRatio:Math.max(0,Math.min(1,p.yRatio))};applyPosition();savePosition();}, getState:()=>({action:current||"normal",position:pos,queue:queue.map(x=>x.action)}), destroy(){destroyed=true;clearTimeout(timer);clearTimeout(idleTimer);removeEventListener("resize",applyPosition);root.remove();}};
  }
  global.HeisongkeDesktopPet = {create, actions:ACTIONS, events:EVENTS};
})(window);
