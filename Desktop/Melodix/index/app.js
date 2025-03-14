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
    '01-fatality-start.mp3', '02-ladder-select.mp3', '03-there-is-no-knowledge-that-is-not-power.mp3',
    '05-versus.mp3', '10-fatality-announcer.mp3', '78-fight.mp3',
    '79-round-one.mp3', 'ak47_boltpull.mp3', 'c4_beep1.mp3',
    'uvazhaja.mp3', 'ak47_boltpull.mp3', 'c4_beep1.mp3'
  ];

  // Цвета для падов
  const colors = [
    '#FF5252', '#FF4081', '#E040FB',
    '#7C4DFF', '#536DFE', '#448AFF',
    '#40C4FF', '#18FFFF', '#64FFDA',
    '#69F0AE', '#B2FF59', '#EEFF41'
  ];

  // Создание контейнера для падов
  const padsContainer = document.createElement('div');
  padsContainer.className = 'pads-container';
  document.body.appendChild(padsContainer);

  // Создание 12 падов (3 колонки x 4 ряда)
  for (let i = 0; i < 12; i++) {
    const pad = document.createElement('div');
    pad.className = 'pad';
    pad.style.backgroundColor = colors[i];
    
    // Создание аудио элемента
    const audio = document.createElement('audio');
    audio.src = `./sounds/${sounds[i]}`;
    pad.appendChild(audio);

    // Обработчик нажатия на пад
    pad.addEventListener('click', function() {
      // Воспроизведение звука
      const sound = this.querySelector('audio');
      sound.currentTime = 0;
      sound.play()
        .then(() => log(`Воспроизведение звука: ${sounds[i]}`))
        .catch(err => log(`Ошибка воспроизведения звука ${sounds[i]}:`, err.message));

      // Анимация нажатия (изменение цвета)
      const originalColor = this.style.backgroundColor;
      this.style.backgroundColor = '#FFFFFF';
      
      setTimeout(() => {
        this.style.backgroundColor = originalColor;
      }, 100);
    });

    padsContainer.appendChild(pad);
  }
  
  log('DJ-пады созданы', { count: 12 });
}