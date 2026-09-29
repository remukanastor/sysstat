const output = document.getElementById("terminalOutput");
const activePrompt = document.getElementById("activePrompt");
const bootOverlay = document.getElementById("bootOverlay");
const soundButton = document.getElementById("soundButton");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let audioEnabled = false;
let audioCtx = null;

function beep(type = "key") {
  if (!audioEnabled) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type === "error" ? "square" : "sine";
  osc.frequency.value = type === "error" ? 105 : 720;

  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(type === "error" ? 0.025 : 0.012, audioCtx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (type === "error" ? 0.12 : 0.035));

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + .14);
}

soundButton.addEventListener("click", async () => {
  audioEnabled = !audioEnabled;
  if (audioEnabled) {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    beep();
  }
  soundButton.textContent = `SOUND: ${audioEnabled ? "ON" : "OFF"}`;
});

function addLine(html = "") {
  const line = document.createElement("div");
  line.className = "line";
  line.innerHTML = html;
  output.appendChild(line);
}

async function typeInto(element, text, speed = 80) {
  for (const char of text) {
    element.appendChild(document.createTextNode(char));
    if (char !== " " && Math.random() > .62) beep("key");
    await sleep(speed + Math.random() * 28);
  }
}

async function commandLine(command) {
  const line = document.createElement("div");
  line.className = "line";
  output.appendChild(line);

  const p = document.createElement("span");
  p.className = "prompt";
  p.textContent = "root@gov:~# ";
  line.appendChild(p);

  const cmd = document.createElement("span");
  line.appendChild(cmd);
  await typeInto(cmd, command, 83);
}

async function outputLine(html, delay = 220) {
  await sleep(delay);
  addLine(html);
  if (html.includes("red")) beep("error");
}

async function boot() {
  await sleep(2050);
  bootOverlay.classList.add("done");
  await sleep(480);

  await commandLine("system status");
  await sleep(500);

  await outputLine("", 180);
  await outputLine("SYSTEM : RUNNING", 240);
  await outputLine("SERVICES : 24/7 ONLINE", 130);
  await outputLine("PROCESS : ACTIVE", 130);

  await outputLine("", 390);
  await outputLine("[GLYPH] See : IGNORED", 190);
  await outputLine("[GLYPH] Nourish : <span class='red'>FAILED</span>", 190);
  await outputLine("[GLYPH] Question : <span class='red'>BLOCKED</span>", 190);

  await outputLine("", 470);
  await outputLine("[!!] system.health <span class='red'>CRITICAL</span>", 190);
  await outputLine("[!!] error.threshold <span class='red'>EXCEEDED</span>", 190);
  await outputLine("[!!] warning.level <span class='red'>DANGER</span>", 190);

  await outputLine("", 470);
  await outputLine("ALARM : TRIGGERED", 190);
  await outputLine("SPEAKER : MUTED", 150);
  await outputLine("NOTIFICATION : DISABLED", 150);
  await outputLine("ACKNOWLEDGED : NO", 150);

  await outputLine("", 520);
  await outputLine("<span class='yellow'>[WARNING] system is no longer healthy</span>", 240);
  await outputLine("<span class='yellow'>[WARNING] critical condition detected</span>", 240);
  await outputLine("<span class='yellow'>[WARNING] continuing operation anyway...</span>", 280);

  await sleep(850);

  activePrompt.innerHTML = "";
  const p = document.createElement("span");
  p.className = "prompt";
  p.textContent = "root@gov:~# ";
  activePrompt.appendChild(p);

  const cursor = document.createElement("span");
  cursor.className = "cursor";
  activePrompt.appendChild(cursor);
}

boot();
