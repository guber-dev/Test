// Используем глобальный объект Telegram
let tg = window.Telegram.WebApp;

// Глобальная переменная для хранения счета
let score = 0;

// Глобальные переменные для работы с уроками
let currentLesson = null;
let lessonActive = false;

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
  
  // Обновляем также счетчик в профиле
  const totalScoreElement = document.querySelector('.total-score');
  if (totalScoreElement) {
    totalScoreElement.textContent = score;
  }
}

// Функция для переключения между разделами
function switchSection(sectionId) {
  // Скрываем все разделы
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  // Показываем выбранный раздел
  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add('active');
  }
  
  // Обновляем активный пункт меню
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.section === sectionId) {
      item.classList.add('active');
    }
  });
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
    
    // Создание списка уроков
    createLessons();
    
    // Инициализация профиля
    initProfile();
    
    // Настройка обработчиков для меню
    setupMenuHandlers();
    
  } catch (error) {
    console.error('Ошибка при инициализации:', error.message);
    // Продолжаем инициализацию даже при ошибке с Telegram API
    preventAccidentalClose();
    createDJPads();
    createLessons();
    initProfile();
    setupMenuHandlers();
  }
});

// Настройка обработчиков для меню
function setupMenuHandlers() {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      switchSection(sectionId);
    });
  });
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
  
  // Получаем раздел с пэдами
  const padsSection = document.getElementById('pads-section');
  if (!padsSection) {
    console.error('Раздел pads-section не найден');
    return;
  }

  // Звуки для падов (выбираем 12 наиболее важных для барабанной установки)
  const sounds = [
    './sounds/Kick.mp3',
    './sounds/Snare01.mp3',
    './sounds/Snare02.mp3',
    './sounds/Hat_Closed.mp3',
    './sounds/Hat_Open.mp3',
    './sounds/Hat.mp3',
    './sounds/Crash01.mp3',
    './sounds/Crash_02.mp3',
    './sounds/Ride01.mp3',
    './sounds/TomF.mp3',
    './sounds/TomM.mp3',
    './sounds/TomL.mp3'
  ];

  // Названия инструментов для падов
  const padLabels = [
    'Kick', 'Snare 1', 'Snare 2',
    'Hi-Hat Closed', 'Hi-Hat Open', 'Hi-Hat',
    'Crash 1', 'Crash 2', 'Ride',
    'Tom High', 'Tom Mid', 'Tom Low'
  ];

  // Создание счетчика MLDX
  const mldxCounter = document.createElement('div');
  mldxCounter.className = 'mldx-counter';
  mldxCounter.innerHTML = `
    <div class="value">${score}</div>
    <div class="label">$MLDX</div>
  `;
  padsSection.appendChild(mldxCounter);

  // Создание контейнера для падов
  const padsContainer = document.createElement('div');
  padsContainer.className = 'pads-container';
  padsSection.appendChild(padsContainer);

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
        
        // Если урок активен, проверяем попадание в ритм
        if (lessonActive && currentLesson) {
          checkRhythmHit(i);
        } else {
          updateScore();
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
        
        // Если урок активен, проверяем попадание в ритм
        if (lessonActive && currentLesson) {
          checkRhythmHit(i);
        } else {
          updateScore();
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

// Функция для создания списка уроков
function createLessons() {
  const lessonsList = document.querySelector('.lessons-list');
  if (!lessonsList) {
    console.error('Контейнер для уроков не найден');
    return;
  }
  
  // Определяем 10 базовых барабанных рудиментов для уроков
  const lessons = [
    {
      id: 'single-stroke-roll',
      title: 'Single Stroke Roll',
      description: 'Базовый рудимент - чередование ударов правой и левой рукой',
      difficulty: 'Начальный',
      pattern: [0, 1, 0, 1, 0, 1, 0, 1], // Индексы падов для последовательности
      tempo: 80 // BPM
    },
    {
      id: 'double-stroke-roll',
      title: 'Double Stroke Roll',
      description: 'По два удара каждой рукой поочередно',
      difficulty: 'Начальный',
      pattern: [0, 0, 1, 1, 0, 0, 1, 1],
      tempo: 70
    },
    {
      id: 'triple-stroke-roll',
      title: 'Triple Stroke Roll',
      description: 'По три удара каждой рукой поочередно',
      difficulty: 'Средний',
      pattern: [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1],
      tempo: 60
    },
    {
      id: 'single-paradiddle',
      title: 'Single Paradiddle',
      description: 'Комбинация одиночных и двойных ударов (RLRR LRLL)',
      difficulty: 'Средний',
      pattern: [0, 1, 0, 0, 1, 0, 1, 1],
      tempo: 70
    },
    {
      id: 'double-paradiddle',
      title: 'Double Paradiddle',
      description: 'Расширенная версия парадидла (RLRLRR LRLRLL)',
      difficulty: 'Средний',
      pattern: [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1],
      tempo: 65
    },
    {
      id: 'five-stroke-roll',
      title: 'Five Stroke Roll',
      description: 'Пять ударов с акцентами',
      difficulty: 'Средний',
      pattern: [0, 0, 1, 1, 0, 1, 1, 0, 0, 1],
      tempo: 60
    },
    {
      id: 'flam',
      title: 'Flam',
      description: 'Основной форшлаг, когда один удар следует сразу за другим',
      difficulty: 'Средний',
      pattern: [0, 1, 0, 1, 0, 1, 0, 1],
      tempo: 60
    },
    {
      id: 'flam-tap',
      title: 'Flam Tap',
      description: 'Комбинация форшлага и одиночного удара',
      difficulty: 'Продвинутый',
      pattern: [0, 1, 0, 1, 0, 1, 0, 1],
      tempo: 55
    },
    {
      id: 'swiss-army-triplet',
      title: 'Swiss Army Triplet',
      description: 'Триольный рудимент с форшлагом',
      difficulty: 'Продвинутый',
      pattern: [0, 0, 1, 1, 1, 0, 0, 0, 1],
      tempo: 50
    },
    {
      id: 'six-stroke-roll',
      title: 'Six Stroke Roll',
      description: 'Шесть ударов с определенным рисунком акцентов',
      difficulty: 'Продвинутый',
      pattern: [0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0],
      tempo: 55
    }
  ];
  
  // Создаем карточки для каждого урока
  lessons.forEach(lesson => {
    const lessonCard = document.createElement('div');
    lessonCard.className = 'lesson-card';
    lessonCard.dataset.id = lesson.id;
    
    lessonCard.innerHTML = `
      <div class="lesson-title">${lesson.title}</div>
      <div class="lesson-description">${lesson.description}</div>
      <div class="lesson-difficulty">${lesson.difficulty}</div>
    `;
    
    // Обработчик клика по уроку
    lessonCard.addEventListener('click', () => {
      startLesson(lesson);
    });
    
    lessonsList.appendChild(lessonCard);
  });
}

// Функция для инициализации профиля
function initProfile() {
  const profileSection = document.getElementById('profile-section');
  if (!profileSection) {
    console.error('Раздел профиля не найден');
    return;
  }
  
  // Получаем данные пользователя из Telegram
  try {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const user = tg.initDataUnsafe.user;
      
      // Устанавливаем имя пользователя
      const profileName = profileSection.querySelector('.profile-name');
      if (profileName) {
        profileName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
      }
      
      // Устанавливаем аватар пользователя, если есть
      const profileAvatar = profileSection.querySelector('.profile-avatar');
      if (profileAvatar && user.photo_url) {
        const img = document.createElement('img');
        img.src = user.photo_url;
        img.alt = 'Аватар';
        profileAvatar.appendChild(img);
      }
    }
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
  }
  
  // Устанавливаем текущий счет
  const totalScore = profileSection.querySelector('.total-score');
  if (totalScore) {
    totalScore.textContent = score;
  }
}

// Функция для запуска урока
function startLesson(lesson) {
  // Переключаемся на раздел с пэдами
  switchSection('pads-section');
  
  // Устанавливаем текущий урок
  currentLesson = lesson;
  lessonActive = true;
  
  // Показываем информацию об уроке
  showLessonInfo(lesson);
  
  // Запускаем анимацию ритма
  startRhythmAnimation(lesson);
}

// Функция для отображения информации об уроке
function showLessonInfo(lesson) {
  // Создаем элемент с информацией об уроке
  const lessonInfo = document.createElement('div');
  lessonInfo.className = 'lesson-info';
  lessonInfo.innerHTML = `
    <div class="lesson-info-title">${lesson.title}</div>
    <div class="lesson-info-description">${lesson.description}</div>
    <div class="lesson-info-tempo">Темп: ${lesson.tempo} BPM</div>
    <button class="lesson-stop-btn">Завершить урок</button>
  `;
  
  // Добавляем кнопку для завершения урока
  const stopBtn = lessonInfo.querySelector('.lesson-stop-btn');
  stopBtn.addEventListener('click', stopLesson);
  
  // Добавляем информацию на страницу
  const padsSection = document.getElementById('pads-section');
  padsSection.appendChild(lessonInfo);
}

// Функция для запуска анимации ритма
function startRhythmAnimation(lesson) {
  // Получаем все пэды
  const pads = document.querySelectorAll('.pad');
  
  // Рассчитываем интервал между ударами в миллисекундах
  const beatInterval = 60000 / lesson.tempo;
  
  // Индекс текущего удара в паттерне
  let currentBeatIndex = 0;
  
  // Создаем интервал для анимации ритма
  const rhythmInterval = setInterval(() => {
    // Получаем индекс пада для текущего удара
    const padIndex = lesson.pattern[currentBeatIndex];
    
    // Находим соответствующий пад
    const pad = pads[padIndex];
    
    // Добавляем анимацию ритма
    addRhythmIndicator(pad);
    
    // Увеличиваем индекс удара или сбрасываем его
    currentBeatIndex = (currentBeatIndex + 1) % lesson.pattern.length;
  }, beatInterval);
  
  // Сохраняем интервал в текущем уроке для возможности остановки
  currentLesson.rhythmInterval = rhythmInterval;
}

// Функция для добавления индикатора ритма на пад
function addRhythmIndicator(pad) {
  // Создаем индикатор ритма
  const rhythmIndicator = document.createElement('div');
  rhythmIndicator.className = 'rhythm-indicator';
  
  // Создаем анимированный круг
  const rhythmCircle = document.createElement('div');
  rhythmCircle.className = 'rhythm-circle pulse';
  
  // Добавляем элементы на пад
  rhythmIndicator.appendChild(rhythmCircle);
  pad.appendChild(rhythmIndicator);
  
  // Удаляем индикатор через 1 секунду
  setTimeout(() => {
    pad.removeChild(rhythmIndicator);
  }, 1000);
}

// Функция для проверки попадания в ритм
function checkRhythmHit(padIndex) {
  // Здесь будет логика проверки попадания в ритм
  // Пока просто добавляем очки
  updateScore(2);
  
  // Показываем обратную связь
  showRhythmFeedback('perfect');
}

// Функция для отображения обратной связи о попадании в ритм
function showRhythmFeedback(type) {
  // Создаем элемент обратной связи
  const feedback = document.createElement('div');
  feedback.className = `rhythm-feedback ${type}`;
  
  // Устанавливаем текст в зависимости от типа
  switch (type) {
    case 'perfect':
      feedback.textContent = 'Идеально!';
      break;
    case 'good':
      feedback.textContent = 'Хорошо!';
      break;
    case 'miss':
      feedback.textContent = 'Мимо!';
      break;
  }
  
  // Добавляем элемент на страницу
  const padsSection = document.getElementById('pads-section');
  padsSection.appendChild(feedback);
  
  // Удаляем элемент после анимации
  setTimeout(() => {
    padsSection.removeChild(feedback);
  }, 500);
}

// Функция для завершения урока
function stopLesson() {
  // Останавливаем анимацию ритма
  if (currentLesson && currentLesson.rhythmInterval) {
    clearInterval(currentLesson.rhythmInterval);
  }
  
  // Удаляем информацию об уроке
  const lessonInfo = document.querySelector('.lesson-info');
  if (lessonInfo) {
    lessonInfo.remove();
  }
  
  // Сбрасываем флаги
  lessonActive = false;
  currentLesson = null;
}