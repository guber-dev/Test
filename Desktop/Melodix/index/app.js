// Используем глобальный объект Telegram вместо импорта SDK
// Инициализация приложения
let tg = window.Telegram.WebApp;

// Функция для создания панели отладки
function createDebugPanel() {
  const debugPanel = document.createElement('div');
  debugPanel.className = 'debug-panel';
  
  // Заголовок панели
  const header = document.createElement('h3');
  header.textContent = 'Отладочная информация';
  debugPanel.appendChild(header);
  
  // Контейнер для логов
  const logContainer = document.createElement('div');
  logContainer.className = 'log-container';
  debugPanel.appendChild(logContainer);
  
  // Кнопка для скрытия/показа панели
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Скрыть';
  toggleButton.className = 'toggle-debug';
  toggleButton.addEventListener('click', () => {
    if (logContainer.style.display === 'none') {
      logContainer.style.display = 'block';
      toggleButton.textContent = 'Скрыть';
    } else {
      logContainer.style.display = 'none';
      toggleButton.textContent = 'Показать';
    }
  });
  debugPanel.appendChild(toggleButton);
  
  document.body.appendChild(debugPanel);
  
  return logContainer;
}

// Функция для добавления лога в панель отладки
function log(message, data = null) {
  const logContainer = document.querySelector('.log-container');
  if (!logContainer) return;
  
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  
  const timestamp = new Date().toLocaleTimeString();
  logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
  
  if (data) {
    const dataEl = document.createElement('pre');
    dataEl.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    logEntry.appendChild(dataEl);
  }
  
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
  
  console.log(`[DEBUG] ${message}`, data);
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
  
  log('Блокировка случайного закрытия активирована');
}

// При загрузке документа
document.addEventListener('DOMContentLoaded', () => {
  // Создаем панель отладки
  const logContainer = createDebugPanel();
  
  // Логируем информацию о запуске
  log('Telegram WebApp инициализирован');
  
  try {
    // Получаем данные инициализации
    log('Данные инициализации:', tg.initData);
    
    // Получаем информацию о пользователе
    log('Информация о пользователе:', tg.initDataUnsafe.user);
    
    // Раскрыть на полную высоту
    tg.expand();
    log('Приложение развернуто на полную высоту');
    
    // Активируем блокировку случайного закрытия
    preventAccidentalClose();
    
    // Создание DJ-падов
    createDJPads();
    
  } catch (error) {
    log('Ошибка при инициализации:', error.message);
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

  // Создание заголовка приложения
  const appHeader = document.createElement('div');
  appHeader.className = 'app-header';
  appHeader.textContent = 'Melodix Drumpad';
  document.querySelector('.app-container').appendChild(appHeader);

  // Создание счетчика MLDX
  const mldxCounter = document.createElement('div');
  mldxCounter.className = 'mldx-counter';
  
  const counterValue = document.createElement('div');
  counterValue.className = 'value';
  counterValue.textContent = '100';
  
  const counterLabel = document.createElement('div');
  counterLabel.className = 'label';
  counterLabel.textContent = '$MLDX';
  
  mldxCounter.appendChild(counterValue);
  mldxCounter.appendChild(counterLabel);
  document.querySelector('.app-container').appendChild(mldxCounter);

  // Создание контейнера для падов
  const padsContainer = document.createElement('div');
  padsContainer.className = 'pads-container';
  document.querySelector('.app-container').appendChild(padsContainer);

  // Создание 12 падов (3 колонки x 4 ряда)
  for (let i = 0; i < 12; i++) {
    const pad = document.createElement('div');
    pad.className = 'pad';
    
    // Добавление названия инструмента
    const padLabel = document.createElement('div');
    padLabel.className = 'pad-label';
    padLabel.textContent = padLabels[i];
    pad.appendChild(padLabel);
    
    // Создание аудио элемента
    const audio = document.createElement('audio');
    audio.src = sounds[i];
    pad.appendChild(audio);

    // Обработчик нажатия на пад
    pad.addEventListener('click', function() {
      // Воспроизведение звука
      const sound = this.querySelector('audio');
      sound.currentTime = 0;
      sound.play()
        .then(() => log(`Воспроизведение звука: ${sounds[i]} (${padLabels[i]})`))
        .catch(err => log(`Ошибка воспроизведения звука ${sounds[i]} (${padLabels[i]}):`, err.message));

      // Анимация нажатия (изменение цвета)
      this.classList.add('active');
      
      setTimeout(() => {
        this.classList.remove('active');
      }, 300); // Увеличиваем время, чтобы эффект был более заметен
    });

    padsContainer.appendChild(pad);
  }
  
  // Создание подвала приложения
  const appFooter = document.createElement('div');
  appFooter.className = 'app-footer';
  appFooter.textContent = 'Melodix Drumpad';
  document.querySelector('.app-container').appendChild(appFooter);
  
  log('DJ-пады созданы', { count: 12 });
}