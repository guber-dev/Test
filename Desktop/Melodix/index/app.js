// Используем глобальный объект Telegram
let tg = window.Telegram.WebApp;

// Глобальная переменная для хранения счета
let score = 0;

// Блокировка случайного закрытия приложения при скролле вниз
function preventAccidentalClose() {
  // Предотвращаем закрытие при скролле вниз
  document.body.addEventListener('touchmove', function(e) {
    // Если скролл достиг конца и пытается продолжиться вниз
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      // Предотвращаем дальнейший скролл
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }, { passive: false });
  
  // Предотвращаем закрытие при свайпе вниз
  let startY;
  document.body.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
  }, { passive: true });
  
  document.body.addEventListener('touchmove', function(e) {
    const currentY = e.touches[0].clientY;
    // Если свайп вниз и мы в верхней части страницы
    if (currentY > startY && window.scrollY <= 0) {
      // Предотвращаем свайп
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }, { passive: false });
}

// Функция для обновления счетчика очков
function updateScore() {
  score += 1;
  const scoreElement = document.querySelector('.mldx-counter .value');
  if (scoreElement) {
    scoreElement.textContent = score;
  }
}

// При загрузке документа
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Раскрыть на полную высоту
    tg.expand();
    tg.setViewportHeight(100); // Устанавливаем высоту вьюпорта на 100%
    
    // Включаем подтверждение закрытия
    tg.enableClosingConfirmation();
    
    // Активируем блокировку случайного закрытия
    preventAccidentalClose();
    
    // Создание DJ-падов
    createDJPads();
    
  } catch (error) {
    console.error('Ошибка при инициализации:', error.message);
  }
});

// Функция для создания DJ-падов
function createDJPads() {
  // Звуки для падов
  const sounds = [
    './sounds/01-fatality-start.mp3', 
    './sounds/02-ladder-select.mp3', 
    './sounds/03-there-is-no-knowledge-that-is-not-power.mp3',
    './sounds/05-versus.mp3', 
    './sounds/10-fatality-announcer.mp3', 
    './sounds/78-fight.mp3',
    './sounds/79-round-one.mp3', 
    './sounds/ak47_boltpull.mp3', 
    './sounds/c4_beep1.mp3',
    './sounds/uvazhaja.mp3', 
    './sounds/ak47_boltpull.mp3', 
    './sounds/c4_beep1.mp3'
  ];

  // Названия инструментов для падов
  const padLabels = [
    'Open Hat', 'Hat', 'Snare',
    'VFX 01', 'VFX 02', 'VFX 03',
    'Drop', 'Bass', 'Kick',
    'Melody', 'Clap', 'Siren'
  ];

  // Создание счетчика MLDX
  const mldxCounter = document.createElement('div');
  mldxCounter.className = 'mldx-counter';
  mldxCounter.innerHTML = `
    <div class="value">${score}</div>
    <div class="label">$MLDX</div>
  `;
  document.querySelector('.app-container').appendChild(mldxCounter);

  // Создание контейнера для падов
  const padsContainer = document.createElement('div');
  padsContainer.className = 'pads-container';
  document.querySelector('.app-container').appendChild(padsContainer);

  // Создание аудио контекста для более быстрого воспроизведения
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Кэш для аудио буферов
  const audioBuffers = {};
  
  // Загрузка звуков
  const loadSound = async (url) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Ошибка загрузки звука:', error);
      return null;
    }
  };
  
  // Предзагрузка всех звуков
  const preloadSounds = async () => {
    for (let i = 0; i < sounds.length; i++) {
      audioBuffers[i] = await loadSound(sounds[i]);
    }
  };
  
  // Функция для воспроизведения звука
  const playSound = (index) => {
    if (!audioBuffers[index]) return;
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers[index];
    source.connect(audioContext.destination);
    source.start(0);
  };
  
  // Создание падов
  for (let i = 0; i < 12; i++) {
    const pad = document.createElement('div');
    pad.className = 'pad';
    pad.dataset.index = i; // Сохраняем индекс для идентификации пада
    
    const padLabel = document.createElement('div');
    padLabel.className = 'pad-label';
    padLabel.textContent = padLabels[i];
    
    pad.appendChild(padLabel);
    padsContainer.appendChild(pad);
    
    // Флаг для отслеживания активного состояния
    let isActive = false;
    
    // Обработчик начала касания
    pad.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Предотвращаем стандартное поведение
      
      if (!isActive) {
        isActive = true;
        pad.classList.add('active');
        playSound(i);
        updateScore();
      }
    }, { passive: false });
    
    // Обработчик окончания касания
    pad.addEventListener('touchend', (e) => {
      e.preventDefault();
      isActive = false;
      pad.classList.remove('active');
    }, { passive: false });
    
    // Обработчик отмены касания
    pad.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      isActive = false;
      pad.classList.remove('active');
    }, { passive: false });
    
    // Обработчик клика для десктопа
    pad.addEventListener('mousedown', (e) => {
      if (!isActive) {
        isActive = true;
        pad.classList.add('active');
        playSound(i);
        updateScore();
      }
    });
    
    // Обработчик окончания клика для десктопа
    pad.addEventListener('mouseup', () => {
      isActive = false;
      pad.classList.remove('active');
    });
    
    // Обработчик выхода мыши за пределы пада
    pad.addEventListener('mouseleave', () => {
      if (isActive) {
        isActive = false;
        pad.classList.remove('active');
      }
    });
  }
  
  // Предзагружаем звуки
  preloadSounds();
}