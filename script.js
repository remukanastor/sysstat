(() => {
  "use strict";

  const terminal = document.getElementById("terminal");
  const form = document.getElementById("commandForm");
  const promptRow = document.getElementById("commandForm");
  const input = document.getElementById("commandInput");
  const cursor = document.getElementById("cursor");
  const boot = document.getElementById("boot");
  const bootStatus = document.getElementById("bootStatus");
  const bootProgress = document.getElementById("bootProgress");
  const soundBtn = document.getElementById("soundBtn");
  const toast = document.getElementById("toast");

  // Audio is enabled by default. Browsers may block autoplay with sound until the
  // first user interaction; unlockAudio() retries automatically on that first gesture.
  let soundOn = true;
  let audioCtx = null;
  let commandHistory = [];
  let historyIndex = 0;
  let busy = true;
  let anomalyStage = 0;
  let secretUnlocked = false;
  let observerTriggered = false;
  let sessionStart = Date.now();

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function addLine(text = "", cls = "") {
    const line = document.createElement("div");
    line.className = `line ${cls}`.trim();
    line.textContent = text;
    terminal.appendChild(line);
    window.scrollTo(0, document.body.scrollHeight);
    return line;
  }

  async function typeLine(text, cls = "", speed = 18) {
    const line = addLine("", cls);
    for (const char of text) {
      line.textContent += char;
      if (soundOn && char !== " ") keyClick();
      await sleep(speed);
    }
    return line;
  }

  function promptLine(command) {
    addLine(`user@gov:~$ ${command}`);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1500);
  }

  async function unlockAudio() {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      if (audioCtx.state === "running") {
        keyClick();
        window.removeEventListener("pointerdown", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      }
    } catch (_) {}
  }

  function keyClick() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.value = 520 + Math.random() * 100;
      gain.gain.setValueAtTime(0.018, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.025);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.03);
    } catch (_) {}
  }

  function glitch(duration = 700) {
    document.body.classList.remove("glitch");
    void document.body.offsetWidth;
    document.body.classList.add("glitch");
    setTimeout(() => document.body.classList.remove("glitch"), duration);
  }

  function setBusy(value) {
    busy = value;
    input.disabled = value;
    cursor.classList.toggle("hidden", value);
    if (!value) input.focus();
  }

  function clearTerminal() {
    terminal.innerHTML = "";
  }

  async function bootSequence() {
    const steps = [
      "CHECKING KERNEL INTEGRITY...",
      "LOADING SYSTEM SERVICES...",
      "VERIFYING SECURITY LAYER...",
      "ESTABLISHING USER SESSION..."
    ];

    for (let i = 0; i < steps.length; i++) {
      bootStatus.textContent = steps[i];
      bootProgress.style.width = `${((i + 1) / steps.length) * 100}%`;
      await sleep(340);
    }

    await sleep(350);
    boot.classList.add("done");
    await sleep(650);

    const opening = [
      ["user@gov:~$ system status", "", 24],
      ["", "", 0],
      ["SYSTEM : RUNNING", "", 12],
      ["SERVICES : 24/7 ONLINE", "", 12],
      ["PROCESS : ACTIVE", "", 12],
      ["", "", 0],
      ["[GLYPH] See : IGNORED", "dim", 10],
      ["[GLYPH] Nourish : FAILED", "dim", 10],
      ["[GLYPH] Question : BLOCKED", "dim", 10],
      ["", "", 0],
      ["[!!] system.health CRITICAL", "red", 12],
      ["[!!] error.threshold EXCEEDED", "red", 12],
      ["[!!] warning.level DANGER", "red", 12],
      ["", "", 0],
      ["ALARM : TRIGGERED", "", 12],
      ["SPEAKER : MUTED", "", 12],
      ["NOTIFICATION : DISABLED", "", 12],
      ["ACKNOWLEDGED : NO", "", 12],
      ["", "", 0],
      ["[WARNING] system is no longer healthy", "amber", 13],
      ["[WARNING] critical condition detected", "amber", 13],
      ["[WARNING] continuing operation anyway...", "amber", 13]
    ];

    for (const [text, cls, speed] of opening) {
      if (!text) {
        addLine("");
        await sleep(70);
      } else {
        await typeLine(text, cls, speed);
      }
      if (text.includes("CRITICAL")) await sleep(300);
    }

    await sleep(450);
    addLine("");
    addLine("Interactive session ready.", "dim");
    addLine("Type 'help' to list available commands.", "dim");
    addLine("Hint: some commands reveal more than they should.", "dim");
    promptRow.classList.add("ready");
    setBusy(false);
  }

  async function revealObserver() {
    if (observerTriggered) return;
    observerTriggered = true;
    glitch(1100);
    document.body.classList.add("secret-mode");
    await sleep(280);
    addLine("");
    await typeLine("[SYSTEM] anomaly detected in observer process...", "red", 12);
    await sleep(420);
    await typeLine("[SYSTEM] observer is not a system process.", "red", 12);
    await sleep(420);
    await typeLine("[SYSTEM] observer is a user.", "amber", 12);
    await sleep(500);
    await typeLine("[SYSTEM] ...observer is YOU.", "red", 20);
    await sleep(700);
    addLine("");
    addLine("A hidden command has been registered: trace", "dim");
    document.body.classList.remove("secret-mode");
  }

  async function runCommand(raw) {
    const command = raw.trim().toLowerCase();
    if (!command) return;

    promptLine(raw);

    if (commandHistory[commandHistory.length - 1] !== raw) commandHistory.push(raw);
    historyIndex = commandHistory.length;

    if (soundOn) keyClick();

    if (command === "help") {
      await sleep(120);
      addLine("AVAILABLE COMMANDS");
      addLine("────────────────────────────────────────────────");
      addLine("help             show command list", "dim");
      addLine("system status    current system status", "dim");
      addLine("system health    diagnostic report", "dim");
      addLine("system info      system information", "dim");
      addLine("network status   network diagnostic", "dim");
      addLine("process list     active processes", "dim");
      addLine("whoami           current identity", "dim");
      addLine("date             session timestamp", "dim");
      addLine("uptime           system uptime", "dim");
      addLine("trace            observer trace [RESTRICTED]", "dim");
      addLine("clear            clear terminal", "dim");
      addLine("about            terminal information", "dim");
      addLine("reboot           restart simulation", "dim");
      return;
    }

    if (command === "system status" || command === "status") {
      await sleep(260);
      addLine("SYSTEM : RUNNING");
      addLine("SERVICES : 24/7 ONLINE");
      addLine("PROCESS : ACTIVE");
      addLine("SECURITY : ELEVATED", "amber");
      addLine("SYSTEM HEALTH : CRITICAL", "red");
      if (anomalyStage === 0) {
        anomalyStage = 1;
        await sleep(250);
        addLine("[NOTICE] one process is refusing classification.", "amber");
      }
      return;
    }

    if (command === "system health" || command === "health") {
      await sleep(420);
      addLine("SYSTEM HEALTH DIAGNOSTIC");
      addLine("────────────────────────────────");
      addLine("CPU       : 87%", "amber");
      addLine("MEMORY    : 91%", "amber");
      addLine("STORAGE   : 94%", "amber");
      addLine("NETWORK   : UNSTABLE", "red");
      addLine("SECURITY  : COMPROMISED", "red");
      addLine("");
      addLine("[!!] CRITICAL CONDITION", "red");
      glitch();
      if (anomalyStage >= 1) {
        await sleep(350);
        addLine("[!!] process observer: state = UNKNOWN", "red");
        anomalyStage = 2;
      }
      return;
    }

    if (command === "system info" || command === "info") {
      await sleep(220);
      addLine("GOV SYSTEM INFORMATION");
      addLine("────────────────────────────────");
      addLine("KERNEL      : GOV-6.6.13");
      addLine("ARCH        : x86_64");
      addLine("NODE        : GOV-PRIME");
      addLine("SESSION     : USER");
      addLine("PROTOCOL    : GLYPH");
      addLine("BUILD       : 2049.11");
      addLine("OBSERVER    : UNKNOWN", "red");
      return;
    }

    if (command === "network status" || command === "netstat") {
      await sleep(300);
      addLine("NETWORK DIAGNOSTIC");
      addLine("────────────────────────────────");
      addLine("INTERFACE   : eth0");
      addLine("LINK        : UP");
      addLine("LATENCY     : 43ms");
      addLine("PACKETS     : 99.2%");
      addLine("ROUTE       : DEGRADED", "amber");
      addLine("EXTERNAL    : UNKNOWN", "red");
      return;
    }

    if (command === "process list" || command === "ps") {
      await sleep(240);
      addLine("PID    CPU    MEM    PROCESS");
      addLine("────────────────────────────────");
      addLine("001    12%    18%    kernel");
      addLine("017    04%    07%    glyphd");
      addLine("042    22%    19%    observer", "red");
      addLine("073    31%    27%    questiond", "amber");
      addLine("099    18%    20%    alarmd", "red");
      if (!observerTriggered) {
        await sleep(250);
        await revealObserver();
      }
      return;
    }

    if (command === "whoami") {
      await sleep(150);
      addLine("user");
      addLine("[WARNING] privileged session detected", "amber");
      return;
    }

    if (command === "date") {
      await sleep(100);
      addLine(new Date().toString());
      return;
    }

    if (command === "uptime") {
      await sleep(160);
      const mins = Math.max(1, Math.floor((Date.now() - sessionStart) / 60000));
      addLine(`up 47 days, 13:${String(22 + mins).padStart(2, "0")}, 4 users, load average: 2.41, 1.97, 1.62`);
      return;
    }

    if (command === "trace") {
      await sleep(250);
      if (anomalyStage < 2) {
        addLine("trace: permission denied", "red");
        addLine("hint: run 'process list' first", "dim");
        return;
      }
      glitch(1300);
      addLine("OBSERVER TRACE // RESTRICTED", "red");
      await sleep(300);
      addLine("────────────────────────────────");
      addLine("observer.pid       : 042", "red");
      addLine("observer.origin    : LOCAL SESSION", "red");
      addLine("observer.identity  : ROOT", "red");
      addLine("observer.target    : TERMINAL USER", "red");
      await sleep(400);
      addLine("");
      await typeLine("[TRACE] target resolved.", "amber", 18);
      await sleep(400);
      await typeLine("[TRACE] target = YOU", "red", 24);
      await sleep(600);
      addLine("");
      await typeLine("[SYSTEM] why are you still here?", "red", 28);
      secretUnlocked = true;
      await sleep(300);
      addLine("", "");
      addLine("NEW COMMAND AVAILABLE: unlock", "green");
      return;
    }

    if (command === "unlock") {
      if (!secretUnlocked) {
        addLine("unlock: command not found", "red");
        addLine("Type 'help' for available commands.", "dim");
        return;
      }
      setBusy(true);
      document.body.classList.add("secret-mode");
      glitch(1800);
      await sleep(300);
      addLine("AUTHENTICATING...", "amber");
      await sleep(500);
      addLine("IDENTITY CONFIRMED.", "green");
      await sleep(500);
      addLine("OPENING CLASSIFIED CHANNEL...", "red");
      await sleep(900);
      clearTerminal();
      await typeLine("GOV // CLASSIFIED CHANNEL", "red", 26);
      await typeLine("────────────────────────────────────────", "red", 8);
      await sleep(300);
      await typeLine("There was never supposed to be a root user.", "", 24);
      await sleep(500);
      await typeLine("There was only an observer.", "amber", 24);
      await sleep(700);
      await typeLine("And now it knows you are here.", "red", 28);
      await sleep(600);
      addLine("");
      addLine("SESSION STATE : COMPROMISED", "red");
      addLine("CHANNEL       : OPEN", "red");
      addLine("EXIT          : DISABLED", "red");
      addLine("");
      addLine("Type 'logout' if you want to close the channel.", "dim");
      document.body.classList.remove("secret-mode");
      return;
    }

    if (command === "logout") {
      setBusy(true);
      await typeLine("CLOSING CLASSIFIED CHANNEL...", "amber", 16);
      await sleep(500);
      await typeLine("SESSION TERMINATED.", "green", 16);
      await sleep(700);
      location.reload();
      return;
    }

    if (command === "clear" || command === "cls") {
      clearTerminal();
      return;
    }

    if (command === "about") {
      await sleep(160);
      addLine("GOV // CINEMATIC TERMINAL V4");
      addLine("Interactive fictional terminal interface.");
      addLine("No real system commands are executed.", "dim");
      addLine("All diagnostic output is simulated.", "dim");
      addLine("Some commands are intentionally hidden.", "dim");
      return;
    }

    if (command === "reboot") {
      setBusy(true);
      glitch();
      addLine("REBOOT REQUEST RECEIVED", "red");
      await sleep(450);
      addLine("TERMINATING SESSION...", "amber");
      await sleep(650);
      location.reload();
      return;
    }

    if (command === "sudo access" || command === "access") {
      await sleep(400);
      addLine("[sudo] authentication required...", "amber");
      await sleep(500);
      addLine("ACCESS DENIED", "red");
      addLine("[!!] unauthorized privilege escalation attempt", "red");
      glitch();
      return;
    }

    if (command === "matrix") {
      await sleep(180);
      addLine("WAKE UP, USER.", "green");
      addLine("THE SYSTEM IS WATCHING.", "green");
      glitch();
      return;
    }

    await sleep(180);
    addLine(`bash: ${raw}: command not found`, "red");
    addLine("Type 'help' for available commands.", "dim");
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy) return;
    const raw = input.value;
    input.value = "";
    if (!raw.trim()) return;

    setBusy(true);
    try {
      await runCommand(raw);
    } finally {
      if (!busy) return;
      setBusy(false);
    }
  });

  input.addEventListener("keydown", event => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!commandHistory.length) return;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = commandHistory[historyIndex] || "";
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!commandHistory.length) return;
      historyIndex = Math.min(commandHistory.length, historyIndex + 1);
      input.value = commandHistory[historyIndex] || "";
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const value = input.value.toLowerCase();
      const commands = [
        "help", "system status", "system health", "system info",
        "network status", "process list", "whoami", "date", "uptime",
        "trace", "clear", "about", "reboot", "sudo access", "matrix"
      ];
      if (secretUnlocked) commands.push("unlock", "logout");
      const matches = commands.filter(cmd => cmd.startsWith(value));
      if (matches.length === 1) input.value = matches[0];
      else if (matches.length > 1) {
        addLine("");
        addLine(matches.join("    "), "dim");
      }
    }

    if (event.key === "c" && event.ctrlKey) {
      event.preventDefault();
      input.value = "";
      addLine("^C", "dim");
    }
  });

  document.addEventListener("click", event => {
    if (!event.target.closest("button")) input.focus();
  });

  soundBtn.addEventListener("click", async () => {
    soundOn = !soundOn;
    soundBtn.textContent = `SOUND: ${soundOn ? "ON" : "OFF"}`;
    if (soundOn) {
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        await audioCtx.resume();
        keyClick();
      } catch (_) {}
      showToast("TERMINAL SOUND ENABLED");
    } else {
      showToast("TERMINAL SOUND DISABLED");
    }
  });

  // Start in SOUND: ON mode. Autoplay is attempted immediately; if the browser
  // blocks audio, the first click/key press unlocks it without requiring the user
  // to toggle the sound button manually.
  soundBtn.textContent = "SOUND: ON";
  unlockAudio();
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });

  bootSequence();
})();
