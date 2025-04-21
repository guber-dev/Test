// Используем глобальный объект Telegram
let tg = window.Telegram.WebApp;

// Глобальная переменная для хранения счета
let score = 0;

// Глобальная переменная для режима ритма
let rhythmMode = false;

// Глобальная переменная для текущего активного раздела
let currentSection = 'game-section';

// Глобальный аудио контекст
let audioContext = null;

// Глобальные переменные для записи
let mediaRecorder;
let recordedChunks = [];
let audioSourceNodes = new Map(); // Хранит аудио источники, чтобы избежать повторного подключения
let lastRecordingUrl = null; // Хранит URL последней записи
let lastRecordingBlob = null; // Хранит Blob последней записи
let lastFileName = null; // Хранит имя файла последней записи

// Кэш декодированных буферов
let audioBuffers = new Map();

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
    
    // Запрашиваем полноэкранный режим только на мобильных устройствах
    if (tg.requestFullscreen && isMobileDevice()) {
      tg.requestFullscreen();
      console.log('Запрошен полноэкранный режим на мобильном устройстве');
    } else {
      console.log('Полноэкранный режим не запрошен: не мобильное устройство или функция недоступна');
    }

    // Обновляем отступы безопасных зон
    updateSafeAreaInsets();
    
    // Добавляем обработчики событий для безопасных зон
    if (tg.onEvent) {
      tg.onEvent('safeAreaChanged', updateSafeAreaInsets);
      tg.onEvent('contentSafeAreaChanged', updateSafeAreaInsets);
    }
    
    console.log('Настройки Telegram успешно применены');
  } catch (error) {
    console.error('Ошибка при настройке Telegram:', error.message);
  }
}

// Функция для определения мобильного устройства
function isMobileDevice() {
  // Проверяем User Agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Регулярные выражения для определения мобильных устройств
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Проверяем размер экрана (типичный для мобильных устройств)
  const screenCheck = window.innerWidth <= 768;
  
  // Проверяем ориентацию (если она доступна, это, скорее всего, мобильное устройство)
  const hasOrientation = typeof window.orientation !== 'undefined';
  
  // Проверяем поддержку touch событий
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Проверяем платформу
  const platform = navigator.platform;
  const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const isDesktopPlatform = macPlatforms.includes(platform) || windowsPlatforms.includes(platform);
  
  // Если в User Agent есть упоминание мобильных платформ,
  // или размер экрана подходит для мобильных, и это не десктопная платформа
  return (mobileRegex.test(userAgent) || (screenCheck && touchSupport && !isDesktopPlatform));
}

// Функция для обновления отступов безопасных зон
function updateSafeAreaInsets() {
  try {
    if (window.Telegram?.WebApp?.safeAreaInset) {
      const safeArea = window.Telegram.WebApp.safeAreaInset;
      const contentSafeArea = window.Telegram.WebApp.contentSafeAreaInset;
      
      // Обновляем CSS-переменные
      document.documentElement.style.setProperty('--safe-area-inset-top', `${safeArea.top}px`);
      document.documentElement.style.setProperty('--safe-area-inset-bottom', `${safeArea.bottom}px`);
      document.documentElement.style.setProperty('--safe-area-inset-left', `${safeArea.left}px`);
      document.documentElement.style.setProperty('--safe-area-inset-right', `${safeArea.right}px`);
      
      // Обновляем отступы для контента
      document.documentElement.style.setProperty('--content-safe-area-inset-top', `${contentSafeArea.top}px`);
      document.documentElement.style.setProperty('--content-safe-area-inset-bottom', `${contentSafeArea.bottom}px`);
      document.documentElement.style.setProperty('--content-safe-area-inset-left', `${contentSafeArea.left}px`);
      document.documentElement.style.setProperty('--content-safe-area-inset-right', `${contentSafeArea.right}px`);
      
      console.log('Отступы безопасных зон обновлены:', {
        safeArea,
        contentSafeArea
      });
    }
  } catch (error) {
    console.error('Ошибка при обновлении отступов безопасных зон:', error);
  }
}

// Функция для выхода из полноэкранного режима
function exitFullscreenMode() {
    if (window.Telegram?.WebApp?.exitFullscreen) {
        window.Telegram.WebApp.exitFullscreen();
        console.log('Выход из полноэкранного режима');
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

// Загрузка данных пользователя из Telegram
function loadUserData() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            const user = window.Telegram.WebApp.initDataUnsafe?.user;
            
            if (user) {
                console.log('Данные пользователя получены:', user);
                
                // Обновляем имя пользователя
                const nameElement = document.querySelector('.profile-name');
                if (nameElement) {
                    const fullName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
                    nameElement.textContent = fullName;
                }
                
                // Обновляем аватар пользователя, если есть фото
                const avatarElement = document.querySelector('.profile-avatar');
                if (avatarElement && user.photo_url) {
                    // Удаляем иконку Font Awesome
                    avatarElement.innerHTML = '';
                    
                    // Создаем элемент изображения
                    const img = document.createElement('img');
                    img.src = user.photo_url;
                    img.alt = 'Аватар пользователя';
                    img.className = 'user-avatar-img';
                    
                    // Добавляем изображение в контейнер аватара
                    avatarElement.appendChild(img);
                }
            } else {
                console.warn('Данные пользователя недоступны');
            }
        } else {
            console.warn('Telegram WebApp API недоступен');
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('DOM загружен, начинаем инициализацию приложения');
        
        // Инициализация Telegram Mini App
        if (window.Telegram && window.Telegram.WebApp) {
            console.log('Telegram WebApp API доступен');
            window.Telegram.WebApp.ready();
            // Запрашиваем полноэкранный режим после инициализации
            setupTelegramColors();
        } else {
            console.warn('Telegram WebApp API недоступен');
        }
        
        // Инициализируем аудио контекст
        initAudioContext();
        
        // Создаем DJ-пады - самое важное
        const padsCreated = createDJPads();
        if (!padsCreated) {
            console.error('Не удалось создать DJ-пады');
        }
        
        // Добавляем дополнительные функции, только если пады созданы
        if (padsCreated) {
            // Создаем интерфейс записи
            try {
                createRecordingInterface();
            } catch (e) {
                console.error('Ошибка при создании интерфейса записи:', e);
            }
            
            // Инициализируем обработчики меню
            try {
                if (typeof initMenuHandlers === 'function') {
                    initMenuHandlers();
                }
            } catch (e) {
                console.error('Ошибка при инициализации обработчиков меню:', e);
            }
            
            // Загружаем данные пользователя
            try {
                if (typeof loadUserData === 'function') {
                    loadUserData();
                }
            } catch (e) {
                console.error('Ошибка при загрузке данных пользователя:', e);
            }
            
            // Показываем секцию игры по умолчанию
            try {
                if (typeof switchSection === 'function') {
                    switchSection('game-section');
                }
            } catch (e) {
                console.error('Ошибка при переключении секции:', e);
            }
        }
        
        // Предотвращаем случайное закрытие - важно для UX
        try {
            preventAccidentalClose();
        } catch (e) {
            console.error('Ошибка при настройке предотвращения закрытия:', e);
        }
        
        console.log('Приложение инициализировано');
    } catch (error) {
        console.error('Критическая ошибка при инициализации приложения:', error);
    }
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
    
    // Обработчик для кнопки приглашения друзей
    const inviteButton = document.getElementById('invite-friends-btn');
    if (inviteButton) {
        inviteButton.addEventListener('click', shareReferralLink);
    }
}

// Функция для создания интерфейса режима ритма
function createRhythmInterface() {
  try {
    // Проверяем, существует ли rhythmManager
    if (!window.rhythmManager || !window.rhythmManager.patterns) {
      console.warn('rhythmManager не найден или не инициализирован');
      return;
    }
    
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
    const gameSection = document.querySelector('#game-section');
    if (gameSection) {
      gameSection.appendChild(rhythmControls);
      
      // Добавляем слушателя событий для менеджера ритма
      window.rhythmManager.addListener(handleRhythmEvent);
    }
  } catch (error) {
    console.error('Ошибка при создании интерфейса ритма:', error);
  }
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

// Инициализация аудио контекста
function initAudioContext() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            console.log('AudioContext инициализирован:', audioContext.state);
        }
    } catch (error) {
        console.error('Ошибка при инициализации AudioContext:', error);
    }
}

// Предварительное декодирование звуков
async function preloadAndDecodeSounds() {
    try {
        if (!audioContext) {
            initAudioContext();
        }

        const sounds = [
            { src: './sounds/TomM.mp3', label: 'Bass Drum' },
            { src: './sounds/Snare01.mp3', label: 'Snare' },
            { src: './sounds/Hat.mp3', label: 'Hi-Hat' },
            { src: './sounds/Rim.mp3', label: 'Rim' },
            { src: './sounds/TomF.mp3', label: 'Tom' },
            { src: './sounds/Crash01.mp3', label: 'Crash' },
            { src: './sounds/Hat_Open.mp3', label: 'Open Hat' },
            { src: './sounds/Crash_02.mp3', label: 'Crash 2' },
            { src: './sounds/Ride01.mp3', label: 'Ride' },
            { src: './sounds/Ride02.mp3', label: 'Ride 2' },
            { src: './sounds/TomL.mp3', label: 'Tom L' },
            { src: './sounds/Shake.mp3', label: 'Shake' }
        ];

        for (const sound of sounds) {
            try {
                const response = await fetch(sound.src);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                audioBuffers.set(sound.src, audioBuffer);
                console.log(`Звук ${sound.src} успешно декодирован`);
            } catch (error) {
                console.error(`Ошибка при декодировании ${sound.src}:`, error);
            }
        }
    } catch (error) {
        console.error('Ошибка при предварительной загрузке звуков:', error);
    }
}

// Воспроизведение звука через AudioContext
function playSound(pad) {
    try {
        if (!audioContext) {
            initAudioContext();
        }

        const soundPath = pad.getAttribute('data-sound');
        const audioBuffer = audioBuffers.get(soundPath);

        if (!audioBuffer) {
            console.error(`Буфер для ${soundPath} не найден`);
            return;
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);

        // Добавляем класс для анимации
        pad.classList.add('active');
        setTimeout(() => {
            pad.classList.remove('active');
        }, 300);

        // Обновляем счет
        if (typeof updateScore === 'function') {
            try {
                updateScore(1);
            } catch (e) {
                console.warn('Ошибка при обновлении счета:', e);
            }
        }
    } catch (error) {
        console.error('Ошибка в функции playSound:', error);
    }
}

// Создание DJ-падов
function createDJPads() {
    try {
        console.log('Начинаем создание DJ-падов');
        
        const gameSection = document.getElementById('game-section');
        if (!gameSection) {
            console.error('Секция игры #game-section не найдена');
            return;
        }
        
        if (document.querySelector('#game-section .pads-container')) {
            console.log('Пады уже созданы');
            return;
        }
        
        const padsContainer = document.createElement('div');
        padsContainer.className = 'pads-container';
        gameSection.appendChild(padsContainer);
        
        const sounds = [
            { src: './sounds/TomM.mp3', label: 'Bass Drum' },
            { src: './sounds/Snare01.mp3', label: 'Snare' },
            { src: './sounds/Hat.mp3', label: 'Hi-Hat' },
            { src: './sounds/Rim.mp3', label: 'Rim' },
            { src: './sounds/TomF.mp3', label: 'Tom' },
            { src: './sounds/Crash01.mp3', label: 'Crash' },
            { src: './sounds/Hat_Open.mp3', label: 'Open Hat' },
            { src: './sounds/Crash_02.mp3', label: 'Crash 2' },
            { src: './sounds/Ride01.mp3', label: 'Ride' },
            { src: './sounds/Ride02.mp3', label: 'Ride 2' },
            { src: './sounds/TomL.mp3', label: 'Tom L' },
            { src: './sounds/Shake.mp3', label: 'Shake' }
        ];
        
        sounds.forEach((sound, index) => {
            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.setAttribute('data-sound', sound.src);
            pad.setAttribute('data-index', index);
            
            const label = document.createElement('div');
            label.className = 'pad-label';
            label.textContent = sound.label;
            
            pad.appendChild(label);
            padsContainer.appendChild(pad);
            
            pad.addEventListener('click', () => playSound(pad));
            pad.addEventListener('touchstart', (e) => {
                e.preventDefault();
                playSound(pad);
            });
        });
        
        // Предварительно загружаем и декодируем звуки
        preloadAndDecodeSounds();
        
        return true;
    } catch (error) {
        console.error('Ошибка при создании DJ-падов:', error);
        return false;
    }
}

// Функция для шаринга реферальной ссылки
async function shareReferralLink() {
    try {
        console.log('Попытка шаринга реферальной ссылки');
        
        // Проверяем, что Telegram WebApp инициализирован
        if (!window.Telegram?.WebApp) {
            console.error('Telegram WebApp не инициализирован');
            return;
        }

        // Получаем данные пользователя из Telegram
        const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
        if (!telegramUser) {
            console.warn('Данные пользователя Telegram недоступны');
            return;
        }

        // Получаем реферальную ссылку
        const referralLink = window.referralSystem?.getReferralLink() || 'https://t.me/your_bot?start=12345';
        console.log('Реферальная ссылка:', referralLink);

        // Проверяем доступность метода showShareSheet
        if (typeof window.Telegram.WebApp.showShareSheet === 'function') {
            // Показываем системное окно выбора чата
            window.Telegram.WebApp.showShareSheet({
                title: '🎵 Присоединяйся к Melodix DJ Pads!',
                text: '🎮 Создавай музыку и зарабатывай бонусы!',
                url: referralLink
            });
        } else {
            // Запасной вариант, если метод недоступен
            console.warn('Метод showShareSheet недоступен');
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert('Функция шаринга недоступна в вашей версии Telegram');
            }
        }

    } catch (error) {
        console.error('Ошибка при шаринге:', error);
        // Показываем ошибку пользователю
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert('Произошла ошибка при отправке ссылки');
        } else {
            alert('Произошла ошибка при отправке ссылки');
        }
    }
}

// Функция для создания интерфейса записи
function createRecordingInterface() {
    // Создаем контейнер для кнопок записи
    const recordingControls = document.createElement('div');
    recordingControls.className = 'recording-controls';
    
    // Кнопка для начала записи
    const startRecordButton = document.createElement('button');
    startRecordButton.className = 'record-button start';
    startRecordButton.textContent = 'Начать запись';
    startRecordButton.addEventListener('click', startRecording);
    
    // Кнопка для остановки записи
    const stopRecordButton = document.createElement('button');
    stopRecordButton.className = 'record-button stop';
    stopRecordButton.textContent = 'Остановить запись';
    stopRecordButton.style.display = 'none';
    stopRecordButton.addEventListener('click', stopRecording);
    
    // Добавляем элементы в контейнер
    recordingControls.appendChild(startRecordButton);
    recordingControls.appendChild(stopRecordButton);
    
    // Добавляем контейнер на страницу
    document.querySelector('#game-section').appendChild(recordingControls);
    
    return { startRecordButton, stopRecordButton };
}

// Функция для начала записи
function startRecording() {
    // Инициализируем аудио контекст, если он еще не инициализирован
    if (!audioContext) {
        initAudioContext();
    }
    
    // Проверяем поддержку MediaRecorder
    if (!window.MediaRecorder) {
        console.error('MediaRecorder не поддерживается в этом браузере');
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert('К сожалению, запись не поддерживается в вашем браузере.');
        }
        return;
    }
    
    try {
        // Очищаем предыдущие источники
        audioSourceNodes.clear();
        
        // Создаем узел назначения для записи
        const dest = audioContext.createMediaStreamDestination();
        
        // Подключаем все звуки к узлу записи
        document.querySelectorAll('.pad audio').forEach(audioElement => {
            // Используем новый источник для каждого аудио элемента
            const source = audioContext.createMediaElementSource(audioElement);
            audioSourceNodes.set(audioElement, source); // Сохраняем источник
            source.connect(dest);
            source.connect(audioContext.destination); // Чтобы звук был слышен во время записи
        });
        
        // Определяем поддерживаемый MIME-тип
        const mimeTypes = [
            'audio/webm',
            'audio/mp4',
            'audio/ogg',
            'audio/wav',
            ''  // Пустая строка означает использование браузерного стандарта по умолчанию
        ];
        
        let mimeType = '';
        
        // Проверяем поддержку MIME-типов
        for (let type of mimeTypes) {
            if (type && MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
                console.log(`Поддерживаемый mimeType найден: ${mimeType}`);
                break;
            }
        }
        
        // Инициализируем MediaRecorder с проверенным MIME-типом
        const options = mimeType ? { mimeType } : {};
        console.log('Создаем MediaRecorder с опциями:', options);
        
        mediaRecorder = new MediaRecorder(dest.stream, options);
        recordedChunks = [];
        
        // Обработчик для сбора данных
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        // Обработчик окончания записи
        mediaRecorder.onstop = handleRecordingStopped;
        
        // Начинаем запись
        mediaRecorder.start();
        
        // Обновляем интерфейс
        const startButton = document.querySelector('.record-button.start');
        const stopButton = document.querySelector('.record-button.stop');
        if (startButton && stopButton) {
            startButton.style.display = 'none';
            stopButton.style.display = 'block';
        }
        
        // Показываем уведомление
        if (window.Telegram?.WebApp?.showPopup) {
            window.Telegram.WebApp.showPopup({
                title: 'Запись начата',
                message: 'Нажимайте на пады, чтобы создать свой бит!',
                buttons: [{type: 'default', text: 'OK'}]
            });
        }
        
        console.log('Запись начата');
        
    } catch (error) {
        console.error('Ошибка при начале записи:', error);
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert('Произошла ошибка при начале записи: ' + error.message);
        }
    }
}

// Функция для остановки записи
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        
        // Обновляем интерфейс
        const startButton = document.querySelector('.record-button.start');
        const stopButton = document.querySelector('.record-button.stop');
        if (startButton && stopButton) {
            startButton.style.display = 'block';
            stopButton.style.display = 'none';
        }
        
        console.log('Запись остановлена');
    }
}

// Обработчик окончания записи
function handleRecordingStopped() {
    try {
        if (recordedChunks.length === 0) {
            console.error('Нет записанных данных');
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert('Не удалось получить записанные данные');
            }
            return;
        }
        
        // Определяем тип контента для файла
        let contentType = 'audio/webm';
        
        // Проверяем тип текущего рекордера
        if (mediaRecorder && mediaRecorder.mimeType) {
            contentType = mediaRecorder.mimeType;
        }
        
        console.log('Тип контента для blob:', contentType);
        
        // Создаем Blob из записанных данных
        const blob = new Blob(recordedChunks, { type: contentType });
        
        // Создаем URL для Blob
        const url = URL.createObjectURL(blob);
        
        // Генерируем расширение файла на основе типа контента
        let fileExtension = 'webm';
        if (contentType.includes('mp4')) fileExtension = 'mp4';
        if (contentType.includes('ogg')) fileExtension = 'ogg';
        if (contentType.includes('wav')) fileExtension = 'wav';
        
        // Создаем имя файла
        const fileName = `drumpad-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${fileExtension}`;
        
        // Сохраняем данные для повторного использования
        lastRecordingUrl = url;
        lastRecordingBlob = blob;
        lastFileName = fileName;
        
        // Показываем интерфейс для записи
        showRecordingInterface();
        
    } catch (error) {
        console.error('Ошибка при обработке записи:', error);
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert('Произошла ошибка при обработке записи: ' + error.message);
        }
    }
}

// Показывает интерфейс для работы с записью
function showRecordingInterface() {
    try {
        if (!lastRecordingUrl || !lastRecordingBlob) {
            console.error('Нет доступной записи');
            return;
        }
        
        // Создаем контейнер для интерфейса записи
        const recordingInterface = document.createElement('div');
        recordingInterface.className = 'recording-result-interface';
        
        // Создаем заголовок
        const title = document.createElement('h3');
        title.textContent = 'Ваша запись';
        
        // Создаем аудио элемент
        const audio = document.createElement('audio');
        audio.className = 'recording-player-audio';
        audio.controls = true;
        audio.src = lastRecordingUrl;
        
        // Создаем кнопки управления
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'recording-buttons';
        
        // Кнопка для скачивания
        const downloadButton = document.createElement('button');
        downloadButton.className = 'recording-button download-button';
        downloadButton.textContent = 'Скачать';
        downloadButton.addEventListener('click', function() {
            downloadRecording();
        });
        
        // Кнопка для закрытия
        const closeButton = document.createElement('button');
        closeButton.className = 'recording-button close-button';
        closeButton.textContent = 'Закрыть';
        closeButton.addEventListener('click', function() {
            const interface = document.querySelector('.recording-result-interface');
            if (interface) {
                interface.remove();
            }
        });
        
        // Добавляем кнопки в контейнер
        buttonsContainer.appendChild(downloadButton);
        buttonsContainer.appendChild(closeButton);
        
        // Добавляем элементы в интерфейс
        recordingInterface.appendChild(title);
        recordingInterface.appendChild(audio);
        recordingInterface.appendChild(buttonsContainer);
        
        // Удаляем предыдущий интерфейс, если он есть
        const existingInterface = document.querySelector('.recording-result-interface');
        if (existingInterface) {
            existingInterface.remove();
        }
        
        // Добавляем интерфейс в DOM
        document.querySelector('#game-section').appendChild(recordingInterface);
        
        // Воспроизводим аудио автоматически
        audio.play().catch(e => {
            console.warn('Автовоспроизведение не удалось:', e);
        });
    } catch (error) {
        console.error('Ошибка при создании интерфейса записи:', error);
    }
}

// Функция для скачивания записи
function downloadRecording() {
    try {
        if (!lastRecordingUrl || !lastFileName) {
            console.error('Нет доступной записи для скачивания');
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert('Нет доступной записи для скачивания');
            }
            return;
        }
        
        console.log('Скачивание записи:', lastFileName);
        
        // Телеграм WebApp запускается внутри WebView, который имеет ограничения с загрузкой файлов
        // Используем несколько стратегий для обеспечения скачивания
        
        if (window.Telegram?.WebApp) {
            if (window.Telegram.WebApp.openLink) {
                // Метод 1: Открытие URL в браузере (может не работать для blob URL)
                try {
                    console.log('Используем Telegram.WebApp.openLink для скачивания');
                    window.Telegram.WebApp.openLink(lastRecordingUrl);
                    
                    // Показываем уведомление
                    setTimeout(() => {
                        if (window.Telegram.WebApp.showPopup) {
                            window.Telegram.WebApp.showPopup({
                                title: 'Загрузка файла',
                                message: 'Файл открыт в браузере. Используйте кнопку "Сохранить" или "Скачать" в браузере.',
                                buttons: [{type: 'default', text: 'OK'}]
                            });
                        }
                    }, 500);
                    return;
                } catch (e) {
                    console.error('Ошибка при использовании openLink:', e);
                }
            }
            
            // Метод 2: Попробуем использовать MainButton с информационным сообщением
            if (window.Telegram.WebApp.MainButton) {
                try {
                    window.open(lastRecordingUrl, '_blank');
                    
                    window.Telegram.WebApp.MainButton.setText('Скачать запись');
                    window.Telegram.WebApp.MainButton.show();
                    window.Telegram.WebApp.MainButton.onClick(() => {
                        window.open(lastRecordingUrl, '_blank');
                    });
                    
                    // Показываем подсказку
                    if (window.Telegram.WebApp.showPopup) {
                        window.Telegram.WebApp.showPopup({
                            title: 'Загрузка файла',
                            message: 'Запись открыта в новом окне. Нажмите на кнопку внизу, чтобы открыть еще раз.',
                            buttons: [{type: 'default', text: 'OK'}]
                        });
                    }
                    return;
                } catch (e) {
                    console.error('Ошибка при использовании MainButton:', e);
                    window.Telegram.WebApp.MainButton.hide();
                }
            }
        }
        
        // Метод 3: Стандартное скачивание через DOM в обычном браузере
        try {
            console.log('Используем стандартный метод скачивания через DOM');
            const downloadLink = document.createElement('a');
            downloadLink.style.display = 'none';
            downloadLink.href = lastRecordingUrl;
            downloadLink.download = lastFileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            
            // Удаляем ссылку из DOM после скачивания
            setTimeout(() => {
                document.body.removeChild(downloadLink);
            }, 100);
            
            // Показываем сообщение об успешной загрузке
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert('Файл загружается. Проверьте папку загрузок.');
            }
        } catch (e) {
            console.error('Ошибка при стандартном методе скачивания:', e);
            
            // Если все методы не работают, показываем уведомление о проблеме
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert('Не удалось скачать запись. Пожалуйста, попробуйте другой браузер или устройство.');
            }
        }
    } catch (error) {
        console.error('Ошибка при скачивании записи:', error);
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert('Ошибка при скачивании записи: ' + error.message);
        }
    }
}