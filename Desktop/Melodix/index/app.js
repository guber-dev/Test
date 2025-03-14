import { init, on, expand } from '@tma.js/sdk';

// Инициализация приложения
const miniApp = init();

// При монтировании приложения
miniApp.ready().then(() => {
  // Раскрыть на полную высоту
  expand().catch(console.error);
  
  // Обновлять высоту при изменении контента
  on('viewport_changed', () => expand());

  // Создание DJ-падов
  createDJPads();
});

// Функция для создания DJ-падов
function createDJPads() {
  // Звуки для падов
  const sounds = [
    '01-fatality-start.mp3', '02-ladder-select.mp3', '03-there-is-no-knowledge-that-is-not-power.mp3',
    '05-versus.mp3', '10-fatality-announcer.mp3', '78-fight.mp3',
    '79-round-one.mp3', 'ak47_boltpull.mp3', 'c4_beep1.mp3',
    'uvazhaja.mp3', 'tom2.mp3', 'crash.mp3'
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
      sound.play();

      // Анимация нажатия (изменение цвета)
      const originalColor = this.style.backgroundColor;
      this.style.backgroundColor = '#FFFFFF';
      
      setTimeout(() => {
        this.style.backgroundColor = originalColor;
      }, 100);
    });

    padsContainer.appendChild(pad);
  }
}