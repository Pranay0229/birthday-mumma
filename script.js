/* =====================================================
   MUMMA'S BIRTHDAY SURPRISE — Main Script Logic
   ===================================================== */

// Global State
let currentPage = 1;
const totalPages = 10;
const secretPasscode = "0229";
let enteredPasscode = "";

// Choice tracking
let wishDone = false;
let cakeDone = false;

// Cake slicing state
let cakeCut = false;
let desktopSlashStart = false;

// Candle state
let candlesBlown = [false, false, false, false, false];

// Carousel 3D state
let carouselAngle = 0;
const totalCards = 8;
let carouselAnimFrame = null;
let isCarouselAutoRotating = false;
let carouselResumeTimeout = null;
const carouselSpeed = 0.22; // Smooth 60fps continuous rotation speed

// Audio Synth & Player
let audioContext = null;
let currentSongId = null;
let isSongPlaying = false;

// Gift Box state
let giftUnwrapped = false;

// Background Audio Player
function playBackgroundSong() {
  const player = document.getElementById("bgAudioPlayer");
  if (player) {
    player.src = "assets/song.mp3";
    player.loop = true;
    player.play().catch((e) => {
      console.log("Background song autoplay error:", e);
    });
  }
}

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  initParticleCanvas();
  initCarousel();
  updateProgressBar();
  initTouchDragCarousel();

  window.addEventListener("resize", () => {
    if (currentPage === 7) {
      updateCarouselTransform();
    }
  });
});

// Sound Synthesizer Fallback (Web Audio API)
function playTone(freq, type = 'sine', duration = 0.3) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.log("Audio synth error:", e);
  }
}

// Chime sound on success
function playSuccessChime() {
  playTone(523.25, 'triangle', 0.2); // C5
  setTimeout(() => playTone(659.25, 'triangle', 0.2), 150); // E5
  setTimeout(() => playTone(783.99, 'triangle', 0.4), 300); // G5
}

// Extinguish Whoosh Sound
function playBlowSound() {
  playTone(200, 'sine', 0.4);
}

// Pop sound for cake/buttons
function playPopSound() {
  playTone(800, 'sine', 0.15);
}

// =====================================================
// PAGE NAVIGATION & PROGRESS BAR
// =====================================================
function goToPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > totalPages) return;

  const curPageElem = document.getElementById(`page${currentPage}`);
  if (curPageElem) {
    curPageElem.classList.remove("active");
    curPageElem.classList.add("exit");
    setTimeout(() => curPageElem.classList.remove("exit"), 400);
  }

  currentPage = pageNumber;
  const nextPageElem = document.getElementById(`page${currentPage}`);
  if (nextPageElem) {
    nextPageElem.classList.add("active");
  }

  // Update Body Theme based on page (Soft Elegant Velvet & Rose Gold variations)
  const body = document.body;
  body.className = ""; // Reset
  if (pageNumber === 1 || pageNumber === 3 || pageNumber === 5 || pageNumber === 9) {
    body.classList.add("theme-red-yellow"); // Warm Rose Gold & Champagne
  } else if (pageNumber === 2 || pageNumber === 6 || pageNumber === 10) {
    body.classList.add("theme-red-black"); // Deep Velvet Ruby & Rose
  } else {
    body.classList.add("theme-yellow-black"); // Amber Candlelight & Warm Velvet
  }

  updateProgressBar();
  playPopSound();

  // Control carousel auto-rotation on Page 7
  if (pageNumber === 7) {
    startCarouselAutoRotate();
  } else {
    stopCarouselAutoRotate();
  }
}

function updateProgressBar() {
  const fill = document.getElementById("progressFill");
  const heartsWrap = document.getElementById("progressHearts");
  if (!fill || !heartsWrap) return;

  const pct = ((currentPage - 1) / (totalPages - 1)) * 100;
  fill.style.width = `${pct}%`;

  heartsWrap.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const span = document.createElement("span");
    span.className = "progress-heart";
    span.textContent = "💖";
    if (i <= Math.ceil((currentPage / totalPages) * 5)) {
      span.classList.add("active");
    }
    heartsWrap.appendChild(span);
  }
}

// =====================================================
// PAGE 2: PASSCODE LOCK SYSTEM
// =====================================================
function pressKey(key) {
  if (enteredPasscode.length < 4) {
    enteredPasscode += key;
    playTone(400 + enteredPasscode.length * 80, 'sine', 0.1);
    updatePasscodeDisplay();
    if (enteredPasscode.length === 4) {
      setTimeout(verifyPasscode, 200);
    }
  }
}

function clearKeys() {
  enteredPasscode = "";
  playTone(300, 'sine', 0.1);
  updatePasscodeDisplay();
}

function backspaceKey() {
  if (enteredPasscode.length > 0) {
    enteredPasscode = enteredPasscode.slice(0, -1);
    playTone(350, 'sine', 0.1);
    updatePasscodeDisplay();
  }
}

function updatePasscodeDisplay() {
  const dots = document.querySelectorAll("#passcodeDisplay .dot");
  dots.forEach((dot, idx) => {
    if (idx < enteredPasscode.length) {
      dot.classList.add("filled");
    } else {
      dot.classList.remove("filled");
    }
  });
}

function verifyPasscode() {
  const card = document.querySelector(".passcode-card");
  if (enteredPasscode === secretPasscode) {
    playSuccessChime();
    playBackgroundSong();
    createEmojiBurst(window.innerWidth / 2, window.innerHeight / 2, ["💖", "✨", "🎂", "🎉"]);
    setTimeout(() => {
      goToPage(3);
    }, 400);
  } else {
    // Shake and clear error
    if (card) {
      card.classList.add("shake");
      setTimeout(() => card.classList.remove("shake"), 400);
    }
    playTone(150, 'sawtooth', 0.3);
    enteredPasscode = "";
    updatePasscodeDisplay();
  }
}

function toggleHint() {
  const hintText = document.getElementById("hintText");
  if (hintText) {
    if (hintText.style.display === "block") {
      hintText.style.display = "none";
    } else {
      hintText.style.display = "block";
      playPopSound();
    }
  }
}

// =====================================================
// PAGE 3: CELEBRATION CONTINUE
// =====================================================
function handleCelebrationContinue() {
  createEmojiBurst(window.innerWidth / 2, window.innerHeight / 2, ["🌸", "✨", "💝", "🥳"]);
  goToPage(4);
}

// =====================================================
// PAGE 4: CHOICE HUB
// =====================================================
function chooseAction(choice) {
  if (choice === 'wish') {
    goToPage(6);
  } else if (choice === 'cake') {
    goToPage(5);
  }
}

function updateChoiceBadges() {
  if (wishDone) {
    const wishBadge = document.getElementById("wishBadge");
    const wishCard = document.getElementById("wishChoice");
    if (wishBadge) wishBadge.classList.remove("hidden");
    if (wishCard) wishCard.classList.add("completed");
  }
  if (cakeDone) {
    const cakeBadge = document.getElementById("cakeBadge");
    const cakeCard = document.getElementById("cakeChoice");
    if (cakeBadge) cakeBadge.classList.remove("hidden");
    if (cakeCard) cakeCard.classList.add("completed");
  }

  if (wishDone && cakeDone) {
    const contBtn = document.getElementById("choiceContinueBtn");
    if (contBtn) contBtn.classList.remove("hidden");
  }
}

function goToMemories() {
  goToPage(7);
}

// =====================================================
// PAGE 5: CAKE CUTTING MECHANICS
// =====================================================
function triggerCakeCut() {
  if (cakeCut) return;
  cakeCut = true;
  const cake = document.getElementById("interactiveCake");
  const cakeMsg = document.getElementById("cakeMessage");
  const cakeBtn = document.getElementById("cakeContinue");

  if (cake) cake.classList.add("cut");
  playSuccessChime();
  createEmojiBurst(window.innerWidth / 2, window.innerHeight / 2, ["🍰", "🍓", "🎉", "✨", "🎂"]);

  if (cakeMsg) {
    cakeMsg.textContent = "Yummy! You cut the birthday cake Mumma! 🎉🍰";
    cakeMsg.classList.remove("hidden");
  }
  if (cakeBtn) cakeBtn.classList.remove("hidden");

  cakeDone = true;
  updateChoiceBadges();
}

function startDesktopSlash(e) {
  desktopSlashStart = true;
}

function trackDesktopSlash(e) {
  if (desktopSlashStart && !cakeCut) {
    triggerCakeCut();
  }
}

function endDesktopSlash() {
  desktopSlashStart = false;
}

function handleCakeContinue() {
  if (!wishDone) {
    goToPage(6);
  } else {
    goToPage(4);
  }
}

// =====================================================
// PAGE 6: MAKE A WISH / CANDLES
// =====================================================
function tapBlowCandle(idx) {
  if (candlesBlown[idx]) return;
  candlesBlown[idx] = true;
  playBlowSound();

  const candles = document.querySelectorAll(".candle-wrap");
  if (candles[idx]) {
    candles[idx].classList.add("blown");
  }

  checkAllCandlesBlown();
}

function blowAllCandles() {
  candlesBlown = [true, true, true, true, true];
  playBlowSound();
  const candles = document.querySelectorAll(".candle-wrap");
  candles.forEach((c) => c.classList.add("blown"));
  checkAllCandlesBlown();
}

function checkAllCandlesBlown() {
  const allBlown = candlesBlown.every((b) => b);
  const wishMsg = document.getElementById("wishMessage");
  const wishBtn = document.getElementById("wishContinue");

  if (allBlown) {
    playSuccessChime();
    createEmojiBurst(window.innerWidth / 2, window.innerHeight / 2, ["✨", "🌟", "💫", "🕯️", "💖"]);
    if (wishMsg) wishMsg.textContent = "All candles blown! May all your wishes come true Mumma! 💫✨";
    if (wishBtn) wishBtn.classList.remove("hidden");
    wishDone = true;
    updateChoiceBadges();
  }
}

function handleWishContinue() {
  if (!cakeDone) {
    goToPage(5);
  } else {
    goToPage(4);
  }
}

// =====================================================
// PAGE 7: 3D MEMORY SCRAPBOOK CAROUSEL (RESPONSIVE)
// =====================================================
function getCarouselRadius() {
  const w = window.innerWidth;
  if (w < 420) return 195;
  if (w < 600) return 235;
  if (w < 900) return 275;
  return 330;
}

function initCarousel() {
  updateCarouselTransform();
}

function startCarouselAutoRotate() {
  stopCarouselAutoRotate();
  isCarouselAutoRotating = true;
  loopCarouselAutoRotate();
}

function stopCarouselAutoRotate() {
  isCarouselAutoRotating = false;
  if (carouselAnimFrame) {
    cancelAnimationFrame(carouselAnimFrame);
    carouselAnimFrame = null;
  }
  if (carouselResumeTimeout) {
    clearTimeout(carouselResumeTimeout);
    carouselResumeTimeout = null;
  }
}

function loopCarouselAutoRotate() {
  if (currentPage === 7 && isCarouselAutoRotating) {
    carouselAngle -= carouselSpeed;
    updateCarouselTransform();
    carouselAnimFrame = requestAnimationFrame(loopCarouselAutoRotate);
  }
}

function pauseCarouselAutoRotateTemporarily() {
  isCarouselAutoRotating = false;
  if (carouselAnimFrame) {
    cancelAnimationFrame(carouselAnimFrame);
    carouselAnimFrame = null;
  }
  if (carouselResumeTimeout) {
    clearTimeout(carouselResumeTimeout);
  }
  // Resume smooth continuous floating rotation after 3.5s of inactivity
  carouselResumeTimeout = setTimeout(() => {
    if (currentPage === 7) {
      startCarouselAutoRotate();
    }
  }, 3500);
}

function rotateCarouselLeft() {
  carouselAngle += 45;
  updateCarouselTransform();
  playPopSound();
  pauseCarouselAutoRotateTemporarily();
}

function rotateCarouselRight() {
  carouselAngle -= 45;
  updateCarouselTransform();
  playPopSound();
  pauseCarouselAutoRotateTemporarily();
}

function updateCarouselTransform() {
  const track = document.getElementById("carouselTrack");
  if (!track) return;
  
  const cards = document.querySelectorAll(".carousel-card");
  const angleStep = 360 / totalCards;
  const radius = getCarouselRadius();

  cards.forEach((card, idx) => {
    const cardAngle = idx * angleStep + carouselAngle;
    card.style.transform = `rotateY(${cardAngle}deg) translateZ(${radius}px)`;
  });

  const scrapbookBtn = document.getElementById("scrapbookContinueBtn");
  if (scrapbookBtn) scrapbookBtn.classList.remove("hidden");
}

function handleCardInteraction(cardIdx) {
  rotateCarouselToCard(cardIdx);
  pauseCarouselAutoRotateTemporarily();
}

function rotateCarouselToCard(targetIdx) {
  const angleStep = 360 / totalCards;
  carouselAngle = -targetIdx * angleStep;
  updateCarouselTransform();
}

function initTouchDragCarousel() {
  const viewport = document.getElementById("carouselViewport");
  if (!viewport) return;

  let startX = 0;
  let isDragging = false;

  viewport.addEventListener("touchstart", (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
  }, { passive: true });

  viewport.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    if (Math.abs(diff) > 35) {
      if (diff > 0) rotateCarouselLeft();
      else rotateCarouselRight();
      isDragging = false;
    }
  }, { passive: true });

  viewport.addEventListener("touchend", () => {
    isDragging = false;
  });
}

// =====================================================
// PAGE 8: SONG SELECTION PLAYER (ROBUST WITH PLAY/PAUSE)
// =====================================================
function selectSong(cardElem, songSrc, songId) {
  const player = document.getElementById("bgAudioPlayer");
  const allCards = document.querySelectorAll(".song-card");

  // If clicking currently active song, toggle play/pause
  if (currentSongId === songId && player && player.src) {
    if (isSongPlaying) {
      player.pause();
      isSongPlaying = false;
      if (cardElem) {
        cardElem.classList.remove("playing");
        cardElem.classList.add("paused");
      }
      return;
    } else {
      player.play().then(() => {
        isSongPlaying = true;
        if (cardElem) {
          cardElem.classList.remove("paused");
          cardElem.classList.add("playing");
        }
      }).catch((e) => console.log("Resume play failed:", e));
      return;
    }
  }

  // New song selection
  currentSongId = songId;
  allCards.forEach((c) => {
    c.classList.remove("active");
    c.classList.remove("playing");
    c.classList.remove("paused");
  });

  if (cardElem) {
    cardElem.classList.add("active");
  }

  if (player) {
    player.pause();
    player.currentTime = 0;
    player.src = songSrc;
    player.loop = true;

    const playPromise = player.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isSongPlaying = true;
        if (cardElem) cardElem.classList.add("playing");
      }).catch((err) => {
        console.warn("First audio attempt with " + songSrc + " failed, trying alternate extension:", err);
        // Fallback between .mp3 and .mpeg
        let fallbackSrc = songSrc.endsWith(".mp3")
          ? songSrc.replace(/\.mp3$/i, ".mpeg")
          : songSrc.replace(/\.mpeg$/i, ".mp3");

        player.src = fallbackSrc;
        player.play().then(() => {
          isSongPlaying = true;
          if (cardElem) cardElem.classList.add("playing");
        }).catch((err2) => {
          console.error("All audio play attempts failed:", err2);
          playTone(523, 'sine', 0.5);
        });
      });
    }
  }

  const songBtn = document.getElementById("songContinue");
  if (songBtn) songBtn.classList.remove("hidden");
  createEmojiBurst(window.innerWidth / 2, window.innerHeight / 2, ["🎵", "🎶", "💖", "🌸"]);
}

// =====================================================
// PAGE 9: INTERACTIVE SURPRISE GIFT BOX
// =====================================================
function unwrapGiftBox() {
  if (giftUnwrapped) return;
  giftUnwrapped = true;

  playSuccessChime();
  const giftBox = document.getElementById("giftBox");
  const giftTapHint = document.getElementById("giftTapHint");
  const giftReveal = document.getElementById("giftRevealCard");
  const giftStage = document.getElementById("giftBoxStage");

  if (giftBox) giftBox.classList.add("unwrapped");
  if (giftTapHint) giftTapHint.style.display = "none";

  createEmojiBurst(window.innerWidth / 2, window.innerHeight / 2, ["👑", "🏆", "🎁", "✨", "💖", "🌸"]);

  setTimeout(() => {
    if (giftStage) giftStage.classList.add("shrunk");
    if (giftReveal) {
      giftReveal.classList.remove("hidden");
      giftReveal.classList.add("revealed");
      createEmojiBurst(window.innerWidth / 2, window.innerHeight / 2, ["💐", "🎉", "⭐", "💕"]);
    }
  }, 650);
}

function celebrateTrait(emoji) {
  playPopSound();
  const rx = window.innerWidth / 2 + (Math.random() - 0.5) * 160;
  const ry = window.innerHeight / 2 + (Math.random() - 0.5) * 160;
  createEmojiBurst(rx, ry, [emoji, "✨", "💖", "🌸"]);
}

// =====================================================
// PAGE 10: FINAL ENVELOPE & LETTER
// =====================================================
function openEnvelope() {
  const env = document.getElementById("envelopeWrap");
  const finalMsg = document.getElementById("finalMsgWrap");
  
  if (env) env.classList.add("open");
  playSuccessChime();

  setTimeout(() => {
    if (env) env.style.display = "none";
    if (finalMsg) {
      finalMsg.classList.remove("hidden");
      createEmojiBurst(window.innerWidth / 2, window.innerHeight / 2, ["💌", "💖", "🌹", "✨"]);
    }
  }, 900);
}

function sealAndSendKisses() {
  playSuccessChime();
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const rx = Math.random() * window.innerWidth;
      const ry = Math.random() * window.innerHeight;
      createEmojiBurst(rx, ry, ["😘", "💋", "💖", "🌸", "🌹", "✨", "🧸"]);
    }, i * 80);
  }
}

// =====================================================
// EMOJI BURST GENERATOR
// =====================================================
function createEmojiBurst(x, y, emojiList) {
  const container = document.getElementById("emojiBurstContainer");
  if (!container) return;

  const count = 12;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "floating-burst-emoji";
    el.textContent = emojiList[Math.floor(Math.random() * emojiList.length)];

    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 140;
    const dx = Math.cos(angle) * dist + "px";
    const dy = Math.sin(angle) * dist - 80 + "px";
    const dr = (Math.random() - 0.5) * 360 + "deg";

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty("--dx", dx);
    el.style.setProperty("--dy", dy);
    el.style.setProperty("--dr", dr);

    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

// =====================================================
// CANVAS PARTICLE SYSTEM ENGINE
// =====================================================
function initParticleCanvas() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const numParticles = 45;

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.8,
      dy: -Math.random() * 1.2 - 0.3,
      alpha: Math.random() * 0.7 + 0.3,
      color: Math.random() > 0.5 ? "#fce3cb" : "#ffffff"
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
    });

    requestAnimationFrame(render);
  }

  render();
}
