/* 병원 택시 체험 휴대폰
   실제 앱(rkun231.github.io/Taxi-helper)과 같은 흐름을 가짜 번호로 보여 준다. 전화는 걸리지 않는다.
   사용: <div data-phone></div> 를 두면 그 자리에 휴대폰이 그려진다. window.TaxiPhone.show("fix") 처럼 장면을 띄울 수 있다. */
(() => {
  const CENTERS = { go: ["전남광역이동지원센터", "1899-1110"], home: ["광주광역시교통약자이동지원센터", "1668-2222"] };
  const DEFAULT = [["아들", "01000000001"], ["며느리", ""], ["큰딸", "01000000003"], ["둘째딸", ""], ["셋째딸", ""], ["막내딸", "01000000006"]];
  const START_HINT = "'병원 갈 때'는 전남 센터, '집에 올 때'는 광주 센터로 연결돼요. 첫 화면에서 '뒤로'도 눌러 보세요.";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const digits = s => String(s || "").replace(/\D/g, "");
  /* 실제 앱과 같은 번호 확인: 010은 11자리, 112·119·1339 같은 1로 시작하는 3~4자리 허용, 그 밖에 7자리 미만은 막음 */
  const usable = n => { const d = digits(n); return d.length >= 7 || (/^1/.test(d) && d.length >= 3 && d.length <= 4); };
  const badNumber = n => { const d = digits(n); if (!d) return ""; if (d.startsWith("010") && d.length !== 11) return "자리 수가 맞지 않아요"; return usable(d) ? "" : "너무 짧아요"; };
  /* 화면에만 '-'를 넣어 보여 줌. 실제 앱(Taxi-helper index.html fmt)과 같은 규칙: 서울 02 번호, 8자리 센터 번호, 112·119 */
  function fmt(n) {
    const d = digits(n);
    if (d.startsWith("02")) {
      if (d.length <= 2) return d;
      if (d.length <= 5) return d.slice(0, 2) + "-" + d.slice(2);
      if (d.length <= 9) return d.slice(0, 2) + "-" + d.slice(2, 5) + "-" + d.slice(5);
      return d.slice(0, 2) + "-" + d.slice(2, 6) + "-" + d.slice(6, 10);
    }
    if (d.length === 8 && /^1[5-9]/.test(d)) return d.slice(0, 4) + "-" + d.slice(4);
    if (/^1/.test(d) && d.length <= 4) return d;
    if (d.length <= 3) return d;
    if (d.length <= 7) return d.slice(0, 3) + "-" + d.slice(3);
    if (d.length <= 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
    return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7, 11);
  }

  /* 휴대폰이 한 페이지에 둘(왼쪽 고정·본문 속)이라 오류 칸 id 앞에 휴대폰마다 다른 이름을 붙인다 */
  let seq = 0;
  const MARKUP = u => `
  <div class="device">
    <div class="screen-area" data-r="screen">
      <div class="ph on" data-s="main">
        <div class="hello">어디로 모실까요?</div>
        <button class="big go" type="button" data-call="go"><span class="ico">🏥</span><span class="t">병원 갈 때</span><span class="r">집에서 병원으로 가요</span></button>
        <button class="big home" type="button" data-call="home"><span class="ico">🏠</span><span class="t">집에 올 때</span><span class="r">병원에서 집으로 와요</span></button>
        <div class="bottom">
          <button class="fix" type="button" data-a="fix">가족 번호 고치기</button>
          <button class="fam" type="button" data-a="family">📞 가족에게 전화</button>
        </div>
      </div>
      <div class="ph" data-s="family">
        <div class="hello">누구에게 걸까요?</div>
        <div data-r="famList" style="display:flex;flex-direction:column;gap:8px"></div>
        <button class="add" type="button" data-a="add">+ 다른 번호 추가</button>
      </div>
      <div class="ph" data-s="add">
        <h4>번호 추가</h4>
        <div class="rows">
          <label class="small">누구예요? (예: 외삼촌, 이웃집)<input type="text" data-r="aLabel" autocomplete="off" aria-describedby="${u}-a-err"></label>
          <label class="small">전화번호<input type="tel" inputmode="tel" data-r="aPhone" placeholder="010-0000-0000" aria-describedby="${u}-a-err"></label>
          <div class="err" data-r="aErr" id="${u}-a-err" role="alert"></div>
        </div>
        <div class="btns">
          <button class="save" type="button" data-a="addSave">추가하기</button>
          <button class="cancel" type="button" data-a="family">취소</button>
        </div>
      </div>
      <div class="ph" data-s="setup">
        <h4>가족 번호 설정</h4>
        <p class="small">번호는 이 휴대폰 안에만 저장됩니다. 비워둔 사람은 화면에 나오지 않아요.</p>
        <div class="rows">
          <div class="rowlist" data-r="rows"></div>
          <button class="add" type="button" data-a="row">+ 다른 번호 추가</button>
        </div>
        <div class="err" data-r="sErr" id="${u}-f-err" role="alert"></div>
        <div class="btns">
          <button class="save" type="button" data-a="setupSave">저장하기</button>
          <button class="cancel" type="button" data-a="home">취소</button>
        </div>
      </div>
      <div class="ph-toast" data-r="toast" hidden>한 번 더 누르면<br>앱이 닫혀요</div>
      <div class="ph-toast" data-r="saved" hidden>저장했어요</div>
      <div class="ph-calling" data-r="calling" hidden>
        <div class="demo">전화 앱으로 넘어간 장면</div>
        <div class="who" data-r="cWho"></div>
        <div class="numtxt" data-r="cNum"></div>
        <div class="demo">체험용이라 실제로 걸리지 않아요</div>
        <button type="button" data-a="hang">통화 끝내기</button>
      </div>
      <div class="ph-closed" data-r="closed" hidden>
        <div>앱이 닫혔어요</div>
        <button class="appicon" type="button" data-a="reopen" aria-label="병원 택시 다시 열기">병원<br>택시</button>
        <div class="sub">아이콘을 누르면 다시 열려요</div>
      </div>
    </div>
    <div class="navbar">
      <button type="button" data-a="back" aria-label="휴대폰 뒤로가기"><span class="glyph">◀</span>뒤로</button>
      <button type="button" data-a="reset" aria-label="체험 처음부터"><span class="glyph">↺</span>처음부터</button>
    </div>
  </div>
  <p class="phone-hint" data-r="hint" aria-live="polite"></p>`;

  function mount(host) {
    host.classList.add("phone-wrap");
    const u = "tp" + (++seq);
    host.innerHTML = MARKUP(u);
    const r = name => host.querySelector(`[data-r="${name}"]`);
    let family, onSub = false, armed = false, timer = null, savedTimer = null;

    const hint = t => { r("hint").textContent = t; };
    const render = s => host.querySelectorAll(".ph").forEach(p => p.classList.toggle("on", p.dataset.s === s));
    const go = s => { onSub = s !== "main"; if (s !== "main") r("saved").hidden = true; render(s); };
    const home = () => go("main");

    function call(who, num, isFamily) {
      r("cWho").textContent = who; r("cNum").textContent = num;
      r("calling").dataset.family = isFamily ? "1" : "";
      r("calling").hidden = false;
    }
    function openFamily() {
      const list = family.filter(f => usable(f.phone));
      r("famList").innerHTML = list.length
        ? list.map(f => `<button class="fam" type="button" data-i="${family.indexOf(f)}">📞 ${esc(f.label)}</button>`).join("")
        : `<div class="empty">아직 등록된 번호가 없어요.<br>가족에게 번호를 넣어 달라고 하세요.</div>`;
      go("family");
      hint("'처음으로' 버튼이 없어요. 이름을 누르면 전화가 걸리고, 그냥 나가려면 '뒤로'를 누르세요.");
    }
    /* 실제 앱 v4와 같은 이름: 스크린리더가 몇 번째 줄인지 알 수 있게 'n번째 줄 호칭/번호' */
    const rowHtml = (f, i) => `<div class="pair"><input type="text" class="fl" value="${esc(f.label)}" placeholder="누구" aria-label="${i + 1}번째 줄 호칭"><input type="tel" class="fp" inputmode="tel" value="${esc(fmt(f.phone))}" placeholder="010-0000-0000" aria-label="${i + 1}번째 줄 번호"></div>`;
    /* 실제 앱 v4와 같은 오류 표시: 틀린 칸은 빨간 테두리 + 그 칸으로 초점, 설정 화면 오류는 틀린 줄 바로 아래 */
    const markBad = el => { el.setAttribute("aria-invalid", "true"); el.focus(); };
    const clearBad = root => root.querySelectorAll("[aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
    function setupErr(msg, row) {
      const e = r("sErr");
      if (row) row.after(e); else host.querySelector('[data-s="setup"] .rows').after(e);
      e.textContent = msg;
    }
    function openSetup() {
      setupErr("");                                  /* 오류 칸을 목록 밖 원래 자리로 (목록을 다시 그리기 전에) */
      r("rows").innerHTML = family.map(rowHtml).join(""); go("setup");
      hint("이 화면은 가족이 써요. 숫자만 쳐도 '-'가 자동으로 붙어요.");
    }
    function back() {
      if (!r("closed").hidden) return;
      if (!r("calling").hidden) { hang(); return; }
      if (onSub) { home(); hint("다른 화면에서 '뒤로'를 누르면 첫 화면으로 돌아와요."); return; }
      if (armed) {
        clearTimeout(timer); armed = false; r("toast").hidden = true; r("closed").hidden = false;
        hint("두 번 누르니 닫혔어요. 예전에는 번호를 고친 횟수만큼 더 눌러야 닫혔어요.");
        return;
      }
      armed = true; r("toast").hidden = false;
      hint("한 번 누르면 큰 글씨로 안내가 떠요. 3초 안에 한 번 더 누르면 닫혀요.");
      clearTimeout(timer);
      timer = setTimeout(() => { armed = false; r("toast").hidden = true; }, 3000);
    }
    function hang() {
      const fam = r("calling").dataset.family;
      r("calling").hidden = true;
      if (fam) { home(); hint("가족과 통화가 끝나면 자동으로 첫 화면이에요. 할머니가 '처음으로' 버튼이 어렵다고 하셔서 없앴어요."); }
    }
    function reset() {
      clearTimeout(timer); armed = false;
      ["toast", "saved", "calling", "closed"].forEach(n => { r(n).hidden = true; });
      family = DEFAULT.map(([label, phone]) => ({ label, phone }));
      home(); hint(START_HINT);
    }

    host.addEventListener("click", e => {
      const callBtn = e.target.closest("[data-call]");
      if (callBtn) {
        const [who, num] = CENTERS[callBtn.dataset.call]; call(who, num, false);
        hint(callBtn.dataset.call === "go" ? "확인 화면 없이 한 번에 전남 센터로 걸려요. 하루 전 오전 10시에 예약하는 곳이에요." : "집에 올 때는 광주 센터로 걸려요. 출발 1시간 전에 부르면 돼요.");
        return;
      }
      const famBtn = e.target.closest("[data-i]");
      if (famBtn) { const f = family[+famBtn.dataset.i]; call(f.label, fmt(f.phone), true); return; }
      const a = e.target.closest("[data-a]"); if (!a) return;
      switch (a.dataset.a) {
        case "fix": openSetup(); break;
        case "family": openFamily(); break;
        case "add": r("aLabel").value = ""; r("aPhone").value = ""; r("aErr").textContent = ""; clearBad(host.querySelector('[data-s="add"]')); go("add"); break;
        case "addSave": {
          const label = r("aLabel").value.trim(), phone = digits(r("aPhone").value);
          r("aErr").textContent = ""; clearBad(host.querySelector('[data-s="add"]'));
          if (!label || !phone) {
            r("aErr").textContent = "이름과 전화번호를 모두 넣어 주세요.";
            if (!phone) r("aPhone").setAttribute("aria-invalid", "true");
            markBad(label ? r("aPhone") : r("aLabel")); break;
          }
          const bad = badNumber(phone);
          if (bad) { r("aErr").textContent = `번호가 ${bad}. 다시 확인해 주세요.`; markBad(r("aPhone")); hint("010 번호는 11자리여야 해요. 112·119처럼 짧은 긴급 번호는 넣을 수 있어요."); break; }
          const slot = family.find(f => f.label === label && !digits(f.phone));
          if (slot) slot.phone = phone; else family.push({ label, phone });
          openFamily(); break;
        }
        case "row": {
          r("rows").insertAdjacentHTML("beforeend", rowHtml({ label: "", phone: "" }, r("rows").querySelectorAll(".pair").length));
          const fl = r("rows").querySelectorAll(".fl"); fl[fl.length - 1].focus(); break;
        }
        case "setupSave": {
          const ls = [...host.querySelectorAll(".fl")], ps = [...host.querySelectorAll(".fp")];
          setupErr(""); clearBad(r("rows"));
          r("rows").querySelectorAll("[aria-describedby]").forEach(el => el.removeAttribute("aria-describedby"));
          const bi = ps.findIndex(p => badNumber(p.value));
          if (bi >= 0) { setupErr(`'${ls[bi].value.trim() || "가족"}' 번호가 ${badNumber(ps[bi].value)}. 다시 확인해 주세요.`, ps[bi].closest(".pair"));
            ps[bi].setAttribute("aria-describedby", r("sErr").id);   /* 틀린 칸에 오류 문구를 연결 (앱과 같음) */
            markBad(ps[bi]);
            hint("번호를 잘못 넣으면 어느 칸인지 알려 주고 저장을 멈춰요."); break; }
          family = ls.map((l, i) => ({ label: l.value.trim() || "가족", phone: digits(ps[i].value) }))
            .filter((f, i) => i < DEFAULT.length || usable(f.phone));
          home(); r("saved").hidden = false; clearTimeout(savedTimer); savedTimer = setTimeout(() => { r("saved").hidden = true; }, 2000);
          hint("저장하면 '저장했어요'가 뜨고 바로 첫 화면이에요. 앱을 켤 때 설정을 먼저 보여 주지 않아요."); break;
        }
        case "home": home(); break;
        case "hang": hang(); break;
        case "back": back(); break;
        case "reset": reset(); break;
        case "reopen": r("closed").hidden = true; home(); hint("다시 열면 언제나 첫 화면부터 시작해요."); break;
      }
    });
    host.addEventListener("input", e => {
      if (e.target.matches('input[type="tel"]')) e.target.value = fmt(e.target.value);
      e.target.removeAttribute("aria-invalid");     /* 고치기 시작하면 빨간 테두리 해제 */
    });

    const flash = el => { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); };
    function show(action) {
      reset();
      if (action === "fix") { flash(host.querySelector(".fix")); hint("밑줄 친 '가족 번호 고치기'를 눌러 보세요. 예전에는 인사말을 3초 꾹 눌러야 열렸어요."); }
      if (action === "family") { openFamily(); flash(r("famList")); }
      if (action === "buttons") { flash(r("screen")); hint("버튼을 누르면 확인 화면 없이 바로 전화 앱으로 넘어가요."); }
      if (action === "labels") { flash(host.querySelector(".big.go")); hint("지명 대신 '집에서 병원으로 가요'처럼 갈 곳을 적었어요."); }
      if (action === "dash") { openSetup(); flash(r("rows")); }
      if (action === "back") { flash(host.querySelector('[data-a="back"]')); hint("첫 화면에서 '뒤로'를 두 번 눌러 보세요."); }
    }
    reset();
    return { show, host };
  }

  const phones = [...document.querySelectorAll("[data-phone]")].map(mount);
  window.TaxiPhone = {
    show(action, opt) {
      /* 보이는 휴대폰을 고른다 (넓은 화면은 왼쪽 고정, 좁은 화면은 본문 속) */
      const p = phones.find(x => x.host.offsetParent !== null) || phones[0]; if (!p) return;
      p.show(action);
      /* 위쪽 고정 바 아래부터 보이게: 휴대폰이 다 들어가면 남은 화면 가운데, 안 들어가면 휴대폰 윗면을 바 바로 아래에 */
      const bar = document.querySelector(".bar");
      const barB = bar && /fixed|sticky/.test(getComputedStyle(bar).position) ? bar.getBoundingClientRect().bottom : 0;
      const rect = p.host.getBoundingClientRect(), room = innerHeight - barB - 16;
      const forced = opt && opt.scroll === "top";
      if (!forced && rect.top >= barB && rect.bottom <= innerHeight) return;
      const top = rect.height <= room ? barB + 8 + (room - rect.height) / 2 : barB + 8;
      window.scrollTo({ top: Math.max(0, scrollY + rect.top - top), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  };
})();
