// Используем глобальный объект Telegram
let tg = window.Telegram.WebApp;

// Глобальная переменная для хранения счета
let score = 0;

// Глобальная переменная для режима ритма
let rhythmMode = false;

// Глобальная переменная для текущего активного раздела
let currentSection = 'game-section';

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

// Переключение между секциями
function switchSection(sectionId) {
    // Скрываем все секции
    document.querySelectorAll('.section-container').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показываем выбранную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // Если это секция игры, убедимся, что DJ-пады созданы
        if (sectionId === 'game-section' && !document.querySelector('#game-section .pad')) {
            createDJPads();
        }
    }
    
    // Обновляем активный элемент меню
    document.querySelectorAll('.bottom-menu a').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });
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

// Обновление счета
function updateScore(points) {
    score += points;
    
    // Обновляем счет в профиле
    const scoreElement = document.querySelector('.profile-stats .stat-value');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    console.log('Счет обновлен:', score);
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

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram Mini App
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    
    // Создаем DJ-пады
    createDJPads();
    
    // Инициализируем обработчики меню
    initMenuHandlers();
    
    // Предотвращаем случайное закрытие
    preventAccidentalClose();
    
    // Показываем секцию игры по умолчанию
    switchSection('game-section');
    
    console.log('Приложение инициализировано');
});

// Инициализация обработчиков меню
function initMenuHandlers() {
    // Обработчики для элементов меню
    document.querySelectorAll('.bottom-menu a').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            switchSection(sectionId);
        });
    });
    
    // Обработчики для кнопок уроков
    document.querySelectorAll('.lesson-button').forEach(button => {
        button.addEventListener('click', function() {
            // Переключаемся на секцию игры
            switchSection('game-section');
            
            // Можно добавить логику для запуска конкретного урока
            // Например, активировать режим ритма с определенными настройками
            console.log('Запуск урока');
        });
    });
}

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
  document.querySelector('#game-section').appendChild(rhythmControls);
  
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

// Создание DJ-падов
function createDJPads() {
    // Проверяем, существует ли уже контейнер с падами
    if (document.querySelector('#game-section .pads-container')) {
        return; // Пады уже созданы
    }
    
    // Создаем контейнер для падов
    const padsContainer = document.createElement('div');
    padsContainer.className = 'pads-container';
    
    // Добавляем контейнер в секцию игры
    document.getElementById('game-section').appendChild(padsContainer);
    
    // Определяем звуки и их метки
    const sounds = [
        { src: './sounds/kick.mp3', label: 'Kick' },
        { src: './sounds/snare.mp3', label: 'Snare' },
        { src: './sounds/hihat.mp3', label: 'Hi-Hat' },
        { src: './sounds/clap.mp3', label: 'Clap' },
        { src: './sounds/tom.mp3', label: 'Tom' },
        { src: './sounds/crash.mp3', label: 'Crash' },
        { src: './sounds/fx1.mp3', label: 'FX 1' },
        { src: './sounds/fx2.mp3', label: 'FX 2' },
        { src: './sounds/vocal1.mp3', label: 'Vocal 1' },
        { src: './sounds/vocal2.mp3', label: 'Vocal 2' },
        { src: './sounds/bass.mp3', label: 'Bass' },
        { src: './sounds/synth.mp3', label: 'Synth' }
    ];
    
    // Создаем пады для каждого звука
    sounds.forEach((sound, index) => {
        // Создаем элемент пада
        const pad = document.createElement('div');
        pad.className = 'pad';
        pad.setAttribute('data-sound', sound.src);
        
        // Создаем аудио элемент
        const audio = document.createElement('audio');
        audio.src = sound.src;
        audio.preload = 'auto';
        
        // Создаем метку для пада
        const label = document.createElement('div');
        label.className = 'pad-label';
        label.textContent = sound.label;
        
        // Добавляем элементы в DOM
        pad.appendChild(audio);
        pad.appendChild(label);
        padsContainer.appendChild(pad);
        
        // Добавляем обработчики событий
        pad.addEventListener('click', function() {
            playSound(this);
        });
        
        pad.addEventListener('touchstart', function(e) {
            e.preventDefault();
            playSound(this);
        });
    });
    
    console.log('DJ-пады созданы');
}

// Воспроизведение звука
function playSound(pad) {
    const audio = pad.querySelector('audio');
    
    // Сбрасываем воспроизведение
    audio.currentTime = 0;
    
    // Воспроизводим звук
    audio.play();
    
    // Добавляем класс для анимации
    pad.classList.add('active');
    
    // Удаляем класс после окончания анимации
    setTimeout(() => {
        pad.classList.remove('active');
    }, 300);
    
    // Обновляем счет
    updateScore(1);
}