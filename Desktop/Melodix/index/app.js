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
    // Инициализация Telegram Mini App
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        // Запрашиваем полноэкранный режим после инициализации
        setupTelegramColors();
    }
    
    // Создаем DJ-пады
    createDJPads();
    
    // Инициализируем обработчики меню
    initMenuHandlers();
    
    // Предотвращаем случайное закрытие
    preventAccidentalClose();
    
    // Загружаем данные пользователя
    loadUserData();
    
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
    
    // Обработчик для кнопки приглашения друзей
    const inviteButton = document.getElementById('invite-friends-btn');
    if (inviteButton) {
        inviteButton.addEventListener('click', shareReferralLink);
    }
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
        const soundPath = pad.getAttribute('data-sound');
        
        // Проверяем, загружен ли звук
        if (!audio.readyState) {
            console.log('Звук еще не загружен, пробуем загрузить:', soundPath);
            audio.load();
        }
        
        // Сбрасываем воспроизведение
        audio.currentTime = 0;
        
        // Пробуем воспроизвести через AudioContext
        if (audioContext && audioContext.state === 'running') {
            const source = audioContext.createMediaElementSource(audio);
            source.connect(audioContext.destination);
            audio.play()
                .then(() => {
                    console.log(`Звук ${soundPath} успешно воспроизведен через AudioContext`);
                })
                .catch(error => {
                    console.error(`Ошибка воспроизведения через AudioContext:`, error);
                    fallbackPlaySound(soundPath);
                });
        } else {
            // Если AudioContext недоступен, используем стандартное воспроизведение
            audio.play()
                .then(() => {
                    console.log(`Звук ${soundPath} успешно воспроизведен`);
                })
                .catch(error => {
                    console.error(`Ошибка воспроизведения:`, error);
                    fallbackPlaySound(soundPath);
                });
        }
        
        // Добавляем класс для анимации
        pad.classList.add('active');
        
        // Удаляем класс после окончания анимации
        setTimeout(() => {
            pad.classList.remove('active');
        }, 300);
        
        // Обновляем счет
        updateScore(1);
        
    } catch (error) {
        console.error('Ошибка в функции playSound:', error);
        fallbackPlaySound(pad.getAttribute('data-sound'));
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
        { src: './sounds/Kick.mp3', label: 'Kick' },
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
    
    // Создаем пады для каждого звука
    sounds.forEach((sound, index) => {
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
    });
    
    console.log('DJ-пады созданы');
    
    // Инициализируем аудио контекст при создании падов
    document.addEventListener('touchstart', function initAudioOnFirstTouch() {
        initAudioContext();
        document.removeEventListener('touchstart', initAudioOnFirstTouch);
    }, { once: true });
}

// Функция для шаринга реферальной ссылки
function shareReferralLink() {
    try {
        // Получаем реферальную ссылку
        const referralLink = window.referralSystem?.getReferralLink();
        if (!referralLink) {
            console.warn('Не удалось получить реферальную ссылку');
            return;
        }

        // Используем метод shareMessage для показа нативного диалога шаринга
        if (window.Telegram?.WebApp?.shareMessage) {
            const messageData = {
                text: `🎵 Присоединяйся к Melodix DJ Pads!\n\n🎮 Создавай музыку и зарабатывай бонусы!\n\n🔗 ${referralLink}`,
                parse_mode: 'HTML'
            };
            
            window.Telegram.WebApp.shareMessage(messageData);
        } else {
            // Запасной вариант, если shareMessage недоступен
            if (window.Telegram?.WebApp?.showPopup) {
                window.Telegram.WebApp.showPopup({
                    title: 'Поделиться с друзьями',
                    message: 'Ссылка скопирована в буфер обмена. Вставьте её в чат, чтобы пригласить друзей!',
                    buttons: [{type: 'default', text: 'OK'}]
                });
                // Копируем ссылку в буфер обмена
                navigator.clipboard.writeText(referralLink);
            }
        }
    } catch (error) {
        console.error('Ошибка при шаринге:', error);
    }
}