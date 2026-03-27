/* ============================================
   EXPOSIÇÃO — Interactive Gallery
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // === Pibble Wash Screen ===
  const pibbleScreen = document.getElementById('pibble-screen');
  const pibbleWrapper = document.getElementById('pibble-wrapper');
  const soapOverlay = document.getElementById('soap-overlay');
  const bubblesContainer = document.getElementById('bubbles-container');
  const progressFill = document.getElementById('wash-progress-fill');
  const pibbleHint = document.getElementById('pibble-hint');

  let washProgress = 0;
  let isWashing = false;
  let lastMoveTime = 0;
  let washComplete = false;
  const WASH_GOAL = 100; // progress needed to complete
  const WASH_SPEED = 2.5; // progress per move event (~2 seconds of active rubbing)

  function spawnBubble(x, y) {
    const bubble = document.createElement('div');
    bubble.className = 'soap-bubble';
    const size = 8 + Math.random() * 18;
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = (x - size / 2) + 'px';
    bubble.style.top = (y - size / 2) + 'px';
    bubblesContainer.appendChild(bubble);
    // Remove bubble after animation
    setTimeout(() => bubble.remove(), 1800);
  }

  function handleWashMove(clientX, clientY) {
    if (washComplete) return;

    const now = Date.now();
    if (now - lastMoveTime < 30) return; // throttle
    lastMoveTime = now;

    // Get position relative to pibble wrapper
    const rect = pibbleWrapper.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Spawn bubbles
    spawnBubble(x, y);
    if (Math.random() > 0.5) spawnBubble(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);

    // Increase progress
    washProgress = Math.min(washProgress + WASH_SPEED, WASH_GOAL);
    const pct = (washProgress / WASH_GOAL) * 100;
    progressFill.style.width = pct + '%';

    // Soap overlay grows
    soapOverlay.style.opacity = Math.min(pct / 100, 0.7);

    // Hide hint after first interaction
    if (washProgress > 5) {
      pibbleHint.style.opacity = '0';
    }

    // Complete!
    if (washProgress >= WASH_GOAL) {
      washComplete = true;
      finishWash();
    }
  }

  function finishWash() {
    // Quick celebration burst of bubbles
    const rect = pibbleWrapper.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        spawnBubble(Math.random() * rect.width, Math.random() * rect.height);
      }, i * 60);
    }

    // Transition out and go directly to gallery (skip music prompt)
    setTimeout(() => {
      pibbleScreen.classList.add('hidden');
      // Start music directly
      const audioEl = document.getElementById('bg-audio');
      audioEl.volume = 0.3;
      audioEl.play().then(() => {
        const audioPlayer = document.querySelector('.audio-player');
        const audioBtn = document.getElementById('audio-btn');
        audioPlayer.classList.add('playing');
        audioBtn.innerHTML = '❚❚';
      }).catch(() => {});
      // Remove pibble screen from DOM after animation
      setTimeout(() => pibbleScreen.remove(), 1000);
    }, 800);
  }

  // Mouse events
  pibbleWrapper.addEventListener('mousedown', () => { isWashing = true; });
  document.addEventListener('mouseup', () => { isWashing = false; });
  pibbleWrapper.addEventListener('mousemove', (e) => {
    if (!isWashing) return;
    handleWashMove(e.clientX, e.clientY);
  });

  // Touch events
  pibbleWrapper.addEventListener('touchstart', (e) => {
    isWashing = true;
    e.preventDefault();
  }, { passive: false });
  pibbleWrapper.addEventListener('touchend', () => { isWashing = false; });
  pibbleWrapper.addEventListener('touchmove', (e) => {
    if (!isWashing) return;
    const touch = e.touches[0];
    handleWashMove(touch.clientX, touch.clientY);
    e.preventDefault();
  }, { passive: false });

  // === Elements ===
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightbox-content');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const audioEl = document.getElementById('bg-audio');
  audioEl.volume = 0.3; // Lower base volume
  const audioBtn = document.getElementById('audio-btn');
  const audioPlayer = document.querySelector('.audio-player');
  const musicPrompt = document.getElementById('music-prompt');
  const musicPromptBtn = document.getElementById('music-prompt-btn');

  let currentIndex = 0;
  let mediaList = [];

  // Build the ordered media list from gallery items
  galleryItems.forEach((item, i) => {
    const img = item.querySelector('img');
    const video = item.querySelector('video');
    if (img) {
      mediaList.push({ type: 'image', src: img.src, index: i });
    } else if (video) {
      mediaList.push({ type: 'video', src: video.querySelector('source').src, index: i });
    }
  });

  // === Music Prompt (autoplay workaround) ===
  musicPromptBtn.addEventListener('click', () => {
    musicPrompt.classList.add('hidden');
    audioEl.play().then(() => {
      audioPlayer.classList.add('playing');
      audioBtn.innerHTML = '❚❚';
    }).catch(() => {});
  });

  // === Audio Toggle ===
  audioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAudio();
  });
  audioPlayer.addEventListener('click', () => {
    toggleAudio();
  });

  function toggleAudio() {
    if (audioEl.paused) {
      audioEl.play().then(() => {
        audioPlayer.classList.add('playing');
        audioBtn.innerHTML = '❚❚';
      });
    } else {
      audioEl.pause();
      audioPlayer.classList.remove('playing');
      audioBtn.innerHTML = '▶';
    }
  }

  // === Lightbox ===
  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  function openLightbox(index) {
    currentIndex = index;
    renderLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    // Pause any playing video in lightbox
    const vid = lightboxContent.querySelector('video');
    if (vid) vid.pause();
  }

  function renderLightbox() {
    const media = mediaList[currentIndex];
    // Pause existing video if any
    const existingVid = lightboxContent.querySelector('video');
    if (existingVid) existingVid.pause();

    if (media.type === 'image') {
      lightboxContent.innerHTML = `<img src="${media.src}" alt="Foto" draggable="false">`;
    } else {
      lightboxContent.innerHTML = `
        <video autoplay loop muted playsinline controls controlsList="nodownload nofullscreen"
               style="max-width:92vw; max-height:88vh;">
          <source src="${media.src}" type="video/mp4">
        </video>`;
      // Remove audio controls via JS (hide volume)
      const vid = lightboxContent.querySelector('video');
      vid.volume = 0;
    }
    lightboxCounter.textContent = `${currentIndex + 1} / ${mediaList.length}`;
  }

  function goNext() {
    currentIndex = (currentIndex + 1) % mediaList.length;
    renderLightbox();
  }

  function goPrev() {
    currentIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
    renderLightbox();
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', goPrev);
  lightboxNext.addEventListener('click', goNext);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  // Touch swipe for lightbox
  let touchStartX = 0;
  let touchEndX = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }, { passive: true });

  // === Scroll Animation (Intersection Observer) ===
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Stagger the animation slightly
        const delay = Math.random() * 150;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '200px 0px 200px 0px',
    threshold: 0
  });

  galleryItems.forEach((item) => {
    observer.observe(item);
  });

  // Fallback: ensure all items become visible after 3 seconds
  // (CSS columns can cause IntersectionObserver to miss some items)
  setTimeout(() => {
    galleryItems.forEach((item) => {
      if (!item.classList.contains('visible')) {
        item.classList.add('visible');
      }
    });
  }, 3000);

  // === Video Autoplay on Scroll ===
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('video');
      if (!video) return;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, {
    rootMargin: '0px',
    threshold: 0.3
  });

  document.querySelectorAll('.gallery-item.video-item').forEach((item) => {
    videoObserver.observe(item);
  });
});
