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
    
    // Запрашиваем полноэкранный режим (Bot API 8.0+)
    if (tg.requestFullscreen) {
      tg.requestFullscreen();
      console.log('Запрошен полноэкранный режим');
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

// Воспроизведение звука
function playSound(pad) {
    try {
        // Инициализируем аудио контекст при первом взаимодействии
        if (!audioContext) {
            initAudioContext();
        }
        
        const audio = pad.querySelector('audio');
        if (!audio) {
            console.error('Аудио элемент не найден в паде');
            return;
        }
        
        const soundPath = pad.getAttribute('data-sound');
        
        // Проверяем, загружен ли звук
        if (!audio.readyState) {
            console.log('Звук еще не загружен, пробуем загрузить:', soundPath);
            audio.load();
        }
        
        // Сбрасываем воспроизведение
        audio.currentTime = 0;
        
        // Пробуем воспроизвести обычным способом
        audio.play()
            .then(() => {
                console.log(`Звук ${soundPath} успешно воспроизведен`);
            })
            .catch(error => {
                console.error(`Ошибка воспроизведения:`, error);
                fallbackPlaySound(soundPath);
            });
        
        // Добавляем класс для анимации
        pad.classList.add('active');
        
        // Удаляем класс после окончания анимации
        setTimeout(() => {
            pad.classList.remove('active');
        }, 300);
        
        // Обновляем счет, если функция существует
        if (typeof updateScore === 'function') {
            try {
                updateScore(1);
            } catch (e) {
                console.warn('Ошибка при обновлении счета:', e);
            }
        }
        
    } catch (error) {
        console.error('Ошибка в функции playSound:', error);
        // Пробуем запасной вариант воспроизведения
        try {
            const soundPath = pad.getAttribute('data-sound');
            if (soundPath) {
                fallbackPlaySound(soundPath);
            }
        } catch (e) {
            console.error('Ошибка в запасном воспроизведении:', e);
        }
    }
}

// Запасной вариант воспроизведения звука
function fallbackPlaySound(soundPath) {
    try {
        const newAudio = new Audio(soundPath);
        newAudio.load();
        newAudio.play()
            .then(() => console.log(`Звук ${soundPath} воспроизведен запасным способом`))
            .catch(err => console.error(`Не удалось воспроизвести звук запасным способом:`, err));
    } catch (error) {
        console.error('Ошибка в запасном методе воспроизведения:', error);
    }
}

// Создание DJ-падов
function createDJPads() {
    try {
        console.log('Начинаем создание DJ-падов');
        
        // Проверяем, существует ли секция игры
        const gameSection = document.getElementById('game-section');
        if (!gameSection) {
            console.error('Секция игры #game-section не найдена');
            return;
        }
        
        // Проверяем, существует ли уже контейнер с падами
        if (document.querySelector('#game-section .pads-container')) {
            console.log('Пады уже созданы');
            return; // Пады уже созданы
        }
        
        // Создаем контейнер для падов
        const padsContainer = document.createElement('div');
        padsContainer.className = 'pads-container';
        
        // Добавляем контейнер в секцию игры
        gameSection.appendChild(padsContainer);
        console.log('Контейнер для падов добавлен в DOM');
        
        // Определяем звуки и их метки
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
        
        console.log(`Подготовлено ${sounds.length} звуков для создания падов`);
        
        // Создаем пады для каждого звука
        sounds.forEach((sound, index) => {
            try {
                // Создаем элемент пада
                const pad = document.createElement('div');
                pad.className = 'pad';
                pad.setAttribute('data-sound', sound.src);
                pad.setAttribute('data-index', index);
                
                // Создаем аудио элемент
                const audio = document.createElement('audio');
                audio.src = sound.src;
                audio.preload = 'auto';
                
                // Добавляем обработчик ошибок для аудио
                audio.addEventListener('error', function(e) {
                    console.error(`Ошибка загрузки звука ${sound.src}:`, e);
                });
                
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
                
                // Предзагружаем звук
                audio.load();
            } catch (error) {
                console.error(`Ошибка при создании пада ${index}:`, error);
            }
        });
        
        console.log('DJ-пады успешно созданы');
        
        // Инициализируем аудио контекст при создании падов
        document.addEventListener('touchstart', function initAudioOnFirstTouch() {
            initAudioContext();
            document.removeEventListener('touchstart', initAudioOnFirstTouch);
        }, { once: true });
        
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
        // Получаем данные пользователя из Telegram
        const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (!telegramUser) {
            console.warn('Данные пользователя Telegram недоступны');
            return;
        }

        // Получаем реферальную ссылку
        // Если referralSystem недоступен, используем заглушку
        const referralLink = window.referralSystem?.getReferralLink() || 'https://t.me/your_bot?start=12345';
        console.log('Реферальная ссылка:', referralLink);

        // Показываем сообщение пользователю
        if (window.Telegram?.WebApp?.showPopup) {
            window.Telegram.WebApp.showPopup({
                title: 'Поделиться с друзьями',
                message: 'Ссылка скопирована в буфер обмена. Вставьте её в чат, чтобы пригласить друзей!',
                buttons: [{type: 'default', text: 'OK'}]
            });
            
            // Копируем ссылку в буфер обмена
            navigator.clipboard.writeText(referralLink).catch(e => {
                console.error('Не удалось скопировать ссылку:', e);
            });
        }
    } catch (error) {
        console.error('Ошибка при шаринге:', error);
        // Не делаем ничего, просто логируем ошибку
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
        // Создаем узел назначения для записи
        const dest = audioContext.createMediaStreamDestination();
        
        // Подключаем все звуки к узлу записи
        document.querySelectorAll('.pad audio').forEach(audioElement => {
            const source = audioContext.createMediaElementSource(audioElement);
            source.connect(dest);
            source.connect(audioContext.destination); // Чтобы звук был слышен во время записи
        });
        
        // Инициализируем MediaRecorder
        mediaRecorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
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
        // Создаем Blob из записанных данных
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        
        // Создаем URL для Blob
        const url = URL.createObjectURL(blob);
        
        // Показываем попап с опциями
        if (window.Telegram?.WebApp?.showPopup) {
            window.Telegram.WebApp.showPopup({
                title: 'Запись завершена',
                message: 'Что вы хотите сделать с записью?',
                buttons: [
                    {
                        type: 'default',
                        text: 'Скачать',
                        id: 'download'
                    },
                    {
                        type: 'default',
                        text: 'Прослушать',
                        id: 'play'
                    },
                    {
                        type: 'cancel',
                        text: 'Отмена'
                    }
                ]
            }, function(buttonId) {
                if (buttonId === 'download') {
                    // Используем Telegram WebApp API для открытия ссылки
                    if (window.Telegram?.WebApp?.openLink) {
                        window.Telegram.WebApp.openLink(url);
                    } else {
                        // Резервный вариант - создаем ссылку для скачивания в DOM
                        createDownloadLink(url, blob.size);
                    }
                } else if (buttonId === 'play') {
                    // Создаем аудио элемент для воспроизведения
                    createAudioPlayer(url);
                }
            });
        } else {
            // Если попап недоступен, создаем элементы управления в DOM
            createAudioPlayer(url);
            createDownloadLink(url, blob.size);
        }
        
    } catch (error) {
        console.error('Ошибка при обработке записи:', error);
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert('Произошла ошибка при обработке записи: ' + error.message);
        }
    }
}

// Создает элемент аудио для воспроизведения
function createAudioPlayer(url) {
    // Удаляем предыдущий плеер, если он есть
    const existingPlayer = document.querySelector('.recording-player');
    if (existingPlayer) {
        existingPlayer.remove();
    }
    
    // Создаем контейнер для плеера
    const playerContainer = document.createElement('div');
    playerContainer.className = 'recording-player';
    
    // Создаем заголовок
    const title = document.createElement('h3');
    title.textContent = 'Ваша запись';
    
    // Создаем аудио элемент
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = url;
    
    // Добавляем элементы в контейнер
    playerContainer.appendChild(title);
    playerContainer.appendChild(audio);
    
    // Добавляем контейнер в DOM
    document.querySelector('#game-section').appendChild(playerContainer);
    
    // Воспроизводим аудио
    audio.play();
}

// Создает ссылку для скачивания
function createDownloadLink(url, size) {
    // Удаляем предыдущую ссылку, если она есть
    const existingLink = document.querySelector('.download-link');
    if (existingLink) {
        existingLink.remove();
    }
    
    // Создаем контейнер для ссылки
    const linkContainer = document.createElement('div');
    linkContainer.className = 'download-link';
    
    // Форматируем размер файла
    const formattedSize = formatFileSize(size);
    
    // Создаем ссылку
    const link = document.createElement('a');
    link.href = url;
    link.download = `drumpad-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    link.textContent = `Скачать запись (${formattedSize})`;
    link.className = 'download-button';
    
    // Добавляем ссылку в контейнер
    linkContainer.appendChild(link);
    
    // Добавляем контейнер в DOM
    document.querySelector('#game-section').appendChild(linkContainer);
}

// Форматирует размер файла
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    } else {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}