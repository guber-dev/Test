// Используем глобальный объект Telegram
let tg = window.Telegram.WebApp;

// Глобальная переменная для хранения счета
let score = 0;

// Глобальная переменная для режима ритма
let rhythmMode = false;

// Настройка цветов и темы для Telegram Mini App
function setupTelegramColors() {
  try {
    // Устанавливаем цвет верхней панели (используем правильный формат)
    if (tg.setHeaderColor) {
      tg.setHeaderColor('bg_color');
    }
    
    // Устанавливаем цвет нижней панели
    if (tg.setBackgroundColor) {
      tg.setBackgroundColor('#1F1F1F');
    }
    
    // Запрашиваем тему
    if (tg.requestTheme) {
      tg.requestTheme();
    }
    
    // Запрашиваем viewport
    if (tg.requestViewport) {
      tg.requestViewport();
    }
    
    console.log('Настройки Telegram успешно применены');
  } catch (error) {
    console.error('Ошибка при настройке Telegram:', error.message);
  }
}

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
function updateScore(points = 1) {
  score += points;
  const scoreElement = document.querySelector('.mldx-counter .value');
  if (scoreElement) {
    scoreElement.textContent = score;
  }
}

// Функция для отображения результата попадания
function showHitResult(result) {
  // Создаем элемент для отображения результата
  const hitResult = document.createElement('div');
  hitResult.className = `hit-result ${result.type.toLowerCase()}`;
  hitResult.textContent = result.type;
  
  // Добавляем элемент на страницу
  document.querySelector('.app-container').appendChild(hitResult);
  
  // Удаляем элемент через некоторое время
  setTimeout(() => {
    hitResult.classList.add('fade-out');
    setTimeout(() => {
      hitResult.remove();
    }, 500);
  }, 500);
}

// При загрузке документа
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Инициализация Telegram Mini App
    setupTelegramColors();
    
    // Раскрыть на полную высоту
    tg.expand();
    
    // Включаем подтверждение закрытия
    tg.enableClosingConfirmation();
    
    // Активируем блокировку случайного закрытия
    preventAccidentalClose();
    
    // Создание DJ-падов
    createDJPads();
    
    // Создание интерфейса для режима ритма
    createRhythmInterface();
    
  } catch (error) {
    console.error('Ошибка при инициализации:', error.message);
    // Продолжаем инициализацию даже при ошибке с Telegram API
    preventAccidentalClose();
    createDJPads();
    createRhythmInterface();
  }
});

// Функция для создания интерфейса режима ритма
function createRhythmInterface() {
  // Создаем контейнер для кнопок режима ритма
  const rhythmControls = document.createElement('div');
  rhythmControls.className = 'rhythm-controls';
  
  // Кнопка для переключения режима
  const toggleButton = document.createElement('button');
  toggleButton.className = 'rhythm-toggle';
  toggleButton.textContent = 'Режим ритма';
  toggleButton.addEventListener('click', toggleRhythmMode);
  
  // Контейнер для выбора паттерна
  const patternSelector = document.createElement('div');
  patternSelector.className = 'pattern-selector';
  
  // Создаем выпадающий список с паттернами
  const patternSelect = document.createElement('select');
  patternSelect.id = 'pattern-select';
  
  // Добавляем опции для каждого паттерна
  const patterns = Object.keys(window.rhythmManager.patterns);
  patterns.forEach(pattern => {
    const option = document.createElement('option');
    option.value = pattern;
    option.textContent = pattern.charAt(0).toUpperCase() + pattern.slice(1);
    patternSelect.appendChild(option);
  });
  
  // Кнопка для запуска паттерна
  const startButton = document.createElement('button');
  startButton.className = 'rhythm-start';
  startButton.textContent = 'Старт';
  startButton.disabled = true;
  startButton.addEventListener('click', startRhythmPattern);
  
  // Добавляем элементы в контейнеры
  patternSelector.appendChild(patternSelect);
  rhythmControls.appendChild(toggleButton);
  rhythmControls.appendChild(patternSelector);
  rhythmControls.appendChild(startButton);
  
  // Добавляем контейнер на страницу
  document.querySelector('.app-container').appendChild(rhythmControls);
  
  // Добавляем слушателя событий для менеджера ритма
  window.rhythmManager.addListener(handleRhythmEvent);
}

// Функция для переключения режима ритма
function toggleRhythmMode() {
  rhythmMode = !rhythmMode;
  
  // Обновляем UI
  const toggleButton = document.querySelector('.rhythm-toggle');
  const startButton = document.querySelector('.rhythm-start');
  const patternSelector = document.querySelector('.pattern-selector');
  
  if (rhythmMode) {
    toggleButton.classList.add('active');
    toggleButton.textContent = 'Режим свободной игры';
    startButton.disabled = false;
    patternSelector.style.display = 'block';
  } else {
    toggleButton.classList.remove('active');
    toggleButton.textContent = 'Режим ритма';
    startButton.disabled = true;
    patternSelector.style.display = 'none';
    
    // Останавливаем текущий паттерн, если он воспроизводится
    window.rhythmManager.stop();
  }
}

// Функция для запуска ритмического паттерна
function startRhythmPattern() {
  if (!rhythmMode) return;
  
  // Получаем выбранный паттерн
  const patternSelect = document.getElementById('pattern-select');
  const selectedPattern = patternSelect.value;
  
  // Устанавливаем и запускаем паттерн
  if (window.rhythmManager.setPattern(selectedPattern)) {
    window.rhythmManager.start();
    
    // Обновляем UI
    const startButton = document.querySelector('.rhythm-start');
    startButton.textContent = 'Играет...';
    startButton.disabled = true;
    
    // Сбрасываем счет
    score = 0;
    updateScore(0);
  }
}

// Обработчик событий ритма
function handleRhythmEvent(event) {
  if (event.type === 'beat') {
    // Подсвечиваем соответствующий пад
    const pad = document.querySelector(`.pad[data-index="${event.beat.pad}"]`);
    if (pad) {
      pad.classList.add('highlight');
      setTimeout(() => {
        pad.classList.remove('highlight');
      }, 200);
    }
  } else if (event.type === 'end') {
    // Обновляем UI после окончания паттерна
    const startButton = document.querySelector('.rhythm-start');
    startButton.textContent = 'Старт';
    startButton.disabled = false;
  }
}

// Функция для создания DJ-падов
function createDJPads() {
  // Проверяем наличие контейнера .app-container
  let appContainer = document.querySelector('.app-container');
  if (!appContainer) {
    console.log('Контейнер .app-container не найден, создаем новый');
    appContainer = document.createElement('div');
    appContainer.className = 'app-container';
    document.body.appendChild(appContainer);
  }

  // Звуки для падов
  const sounds = [
    './sounds/Hat_Open.mp3',
    './sounds/Hat.mp3',
    './sounds/Snare01.mp3',
    './sounds/Crash01.mp3',
    './sounds/Crash_02.mp3',
    './sounds/Ride01.mp3',
    './sounds/Ride02.mp3',
    './sounds/TomF.mp3',
    './sounds/Kick.mp3',
    './sounds/TomL.mp3',
    './sounds/Rim.mp3',
    './sounds/Shake.mp3'
  ];

  // Названия инструментов для падов
  const padLabels = [
    'Open Hat', 'Hat', 'Snare',
    'Crash 1', 'Crash 2', 'Ride 1',
    'Ride 2', 'Tom F', 'Kick',
    'Tom L', 'Rim', 'Shake'
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
  
  // Функция для воспроизведения звука
  const playSound = (index) => {
    try {
      if (audioBuffers[index]) {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers[index];
        source.connect(audioContext.destination);
        source.start(0);
      } else {
        // Резервный вариант, если буфер еще не загружен
        const audio = new Audio(sounds[index]);
        audio.play().catch(err => console.error('Ошибка воспроизведения звука:', err));
      }
    } catch (error) {
      console.error('Ошибка при воспроизведении звука:', error);
      // Резервный вариант при ошибке Web Audio API
      const audio = new Audio(sounds[index]);
      audio.play().catch(err => console.error('Ошибка резервного воспроизведения:', err));
    }
  };
  
  // Предзагрузка всех звуков
  const preloadSounds = async () => {
    try {
      for (let i = 0; i < sounds.length; i++) {
        try {
          audioBuffers[i] = await loadSound(sounds[i]);
        } catch (error) {
          console.error(`Ошибка загрузки звука ${i}:`, error);
        }
      }
    } catch (error) {
      console.error('Ошибка при предзагрузке звуков:', error);
    }
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
        
        // Проверка попадания в ритм, если активен режим ритма
        if (rhythmMode && window.rhythmManager.isPlaying) {
          const result = window.rhythmManager.checkHit(i);
          if (result.hit) {
            updateScore(result.score);
            showHitResult(result);
          } else {
            updateScore(0);
          }
        } else {
          updateScore(1);
        }
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
        
        // Проверка попадания в ритм, если активен режим ритма
        if (rhythmMode && window.rhythmManager.isPlaying) {
          const result = window.rhythmManager.checkHit(i);
          if (result.hit) {
            updateScore(result.score);
            showHitResult(result);
          } else {
            updateScore(0);
          }
        } else {
          updateScore(1);
        }
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