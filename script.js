const participantInput = document.querySelector("#participants");
const participantCount = document.querySelector("#participantCount");
const drawCount = document.querySelector("#drawCount");
const duplicateToggle = document.querySelector("#allowDuplicate");
const drawButton = document.querySelector("#drawButton");
const results = document.querySelector("#results");
const emptyState = document.querySelector("#emptyState");
const historyList = document.querySelector("#historyList");
const toast = document.querySelector("#toast");

let history = [];
let currentWinners = [];

function getParticipants() {
  return participantInput.value
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);
}

function updateParticipantCount() {
  const count = getParticipants().length;
  participantCount.textContent = `${count}명`;
  drawCount.max = Math.max(count, 1);
  if (!duplicateToggle.checked) {
    drawCount.value = Math.min(Number(drawCount.value), count || 1);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function randomShuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function renderWinners(winners) {
  currentWinners = winners;
  emptyState.hidden = winners.length > 0;
  results.hidden = winners.length === 0;
  results.style.gridTemplateColumns = winners.length === 1 ? "repeat(1, minmax(0, 1fr))" : "";
  results.innerHTML = winners.map((name, index) => `
    <article class="winner-card">
      <span class="rank">${String(index + 1).padStart(2, "0")}</span>
      <strong>${escapeHtml(name)}</strong>
    </article>
  `).join("");
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function renderHistory() {
  historyList.innerHTML = history.map((item) => `
    <article class="history-item">
      <span class="time">${item.time}</span>
      <strong>${escapeHtml(item.names.join(", "))}</strong>
      <span class="number">${item.names.length}명</span>
    </article>
  `).join("");
}

participantInput.addEventListener("input", updateParticipantCount);

document.querySelector("#decreaseCount").addEventListener("click", () => {
  drawCount.value = Math.max(1, Number(drawCount.value) - 1);
});

document.querySelector("#increaseCount").addEventListener("click", () => {
  const max = duplicateToggle.checked ? 99 : Math.max(1, getParticipants().length);
  drawCount.value = Math.min(max, Number(drawCount.value) + 1);
});

drawCount.addEventListener("change", () => {
  const max = duplicateToggle.checked ? 99 : Math.max(1, getParticipants().length);
  drawCount.value = Math.min(max, Math.max(1, Number(drawCount.value) || 1));
});

duplicateToggle.addEventListener("change", updateParticipantCount);

drawButton.addEventListener("click", () => {
  const participants = getParticipants();
  const count = Math.max(1, Number(drawCount.value) || 1);

  if (participants.length === 0) {
    showToast("참가자를 입력해 주세요.");
    participantInput.focus();
    return;
  }
  if (!duplicateToggle.checked && count > participants.length) {
    showToast("참가자 수보다 많이 뽑을 수 없습니다.");
    return;
  }

  drawButton.disabled = true;
  drawButton.lastChild.textContent = " 추첨 중...";

  let ticks = 0;
  const interval = window.setInterval(() => {
    const preview = randomShuffle(participants).slice(0, count);
    renderWinners(preview);
    ticks += 1;
    if (ticks >= 12) {
      window.clearInterval(interval);
      const finalWinners = duplicateToggle.checked
        ? Array.from({ length: count }, () => participants[Math.floor(Math.random() * participants.length)])
        : randomShuffle(participants).slice(0, count);
      renderWinners(finalWinners);

      history.unshift({
        names: finalWinners,
        time: new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()),
      });
      history = history.slice(0, 8);
      renderHistory();
      drawButton.disabled = false;
      drawButton.lastChild.textContent = " 제비 뽑기";
    }
  }, 55);
});

document.querySelector("#resetButton").addEventListener("click", () => {
  participantInput.value = "";
  drawCount.value = 1;
  duplicateToggle.checked = false;
  currentWinners = [];
  renderWinners([]);
  updateParticipantCount();
  renderWinners(["김민준", "최지우", "이서연"]);
  participantInput.focus();
});

document.querySelector("#clearHistory").addEventListener("click", () => {
  history = [];
  renderHistory();
  showToast("최근 뽑기 내역을 지웠습니다.");
});

document.querySelector("#copyButton").addEventListener("click", async () => {
  if (!currentWinners.length) {
    showToast("복사할 결과가 없습니다.");
    return;
  }
  const text = currentWinners.map((name, index) => `${index + 1}. ${name}`).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    showToast("결과를 복사했습니다.");
  } catch {
    showToast("복사에 실패했습니다.");
  }
});

document.querySelector("#downloadButton").addEventListener("click", () => {
  if (!currentWinners.length) {
    showToast("다운로드할 결과가 없습니다.");
    return;
  }
  const text = currentWinners.map((name, index) => `${index + 1}. ${name}`).join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "제비뽑기-결과.txt";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#themeButton").addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  const theme = isDark ? "dark" : "light";
  document.body.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#17191c" : "#f3f5f7";
  localStorage.setItem("theme", theme);
  showToast(isDark ? "다크 모드로 전환했습니다." : "화이트 모드로 전환했습니다.");
});

const savedTheme = localStorage.getItem("theme");
const initialTheme = savedTheme === "dark" ? "dark" : "light";
document.body.dataset.theme = initialTheme;
document.body.classList.toggle("dark", initialTheme === "dark");
document.querySelector('meta[name="theme-color"]').content = initialTheme === "dark" ? "#17191c" : "#f3f5f7";

updateParticipantCount();
