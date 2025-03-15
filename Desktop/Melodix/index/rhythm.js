/**
 * Модуль для проверки попадания в ритм
 */

// Константы для настройки точности
const PERFECT_THRESHOLD = 50; // мс для "идеального" попадания
const GOOD_THRESHOLD = 100;   // мс для "хорошего" попадания
const OK_THRESHOLD = 200;     // мс для "нормального" попадания

// Очки за разные типы попадания
const SCORE = {
  PERFECT: 100,
  GOOD: 50,
  OK: 10,
  MISS: 0
};

// Класс для управления ритмическими паттернами
class RhythmManager {
  constructor() {
    this.patterns = {}; // Хранилище паттернов
    this.currentPattern = null; // Текущий активный паттерн
    this.isPlaying = false; // Флаг воспроизведения
    this.startTime = 0; // Время начала воспроизведения
    this.bpm = 120; // Темп по умолчанию (ударов в минуту)
    this.listeners = []; // Слушатели событий
    this.nextBeatIndex = 0; // Индекс следующего ожидаемого удара
  }

  // Добавление ритмического паттерна
  addPattern(name, beats, bpm = 120) {
    this.patterns[name] = {
      beats: beats, // Массив с временными метками ударов в мс
      bpm: bpm
    };
    return this;
  }

  // Установка текущего паттерна
  setPattern(name) {
    if (this.patterns[name]) {
      this.currentPattern = this.patterns[name];
      this.bpm = this.currentPattern.bpm;
      return true;
    }
    return false;
  }

  // Запуск воспроизведения ритма
  start() {
    if (!this.currentPattern) return false;
    
    this.isPlaying = true;
    this.startTime = Date.now();
    this.nextBeatIndex = 0;
    
    // Запускаем таймеры для каждого удара
    this._scheduleBeats();
    
    return true;
  }

  // Остановка воспроизведения
  stop() {
    this.isPlaying = false;
    return this;
  }

  // Проверка попадания в ритм
  checkHit(padIndex) {
    if (!this.isPlaying || !this.currentPattern) return { hit: false, score: 0, type: 'MISS' };
    
    const currentTime = Date.now() - this.startTime;
    const pattern = this.currentPattern;
    
    // Находим ближайший удар
    let closestBeat = null;
    let minDiff = Infinity;
    let beatIndex = -1;
    
    for (let i = 0; i < pattern.beats.length; i++) {
      const beat = pattern.beats[i];
      if (beat.pad !== padIndex) continue; // Проверяем только удары для нужного пада
      
      const diff = Math.abs(currentTime - beat.time);
      if (diff < minDiff) {
        minDiff = diff;
        closestBeat = beat;
        beatIndex = i;
      }
    }
    
    // Если нет подходящего удара или он слишком далеко
    if (!closestBeat || minDiff > OK_THRESHOLD) {
      return { hit: false, score: 0, type: 'MISS', diff: minDiff };
    }
    
    // Определяем тип попадания
    let hitType = 'MISS';
    let score = 0;
    
    if (minDiff <= PERFECT_THRESHOLD) {
      hitType = 'PERFECT';
      score = SCORE.PERFECT;
    } else if (minDiff <= GOOD_THRESHOLD) {
      hitType = 'GOOD';
      score = SCORE.GOOD;
    } else if (minDiff <= OK_THRESHOLD) {
      hitType = 'OK';
      score = SCORE.OK;
    }
    
    // Отмечаем удар как выполненный
    if (hitType !== 'MISS') {
      pattern.beats[beatIndex].hit = true;
    }
    
    return { hit: true, score, type: hitType, diff: minDiff, beat: closestBeat };
  }

  // Добавление слушателя событий
  addListener(callback) {
    this.listeners.push(callback);
    return this;
  }

  // Удаление слушателя событий
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
    return this;
  }

  // Приватный метод для планирования ударов
  _scheduleBeats() {
    if (!this.isPlaying) return;
    
    const pattern = this.currentPattern;
    const beats = pattern.beats;
    
    // Планируем все удары
    beats.forEach((beat, index) => {
      setTimeout(() => {
        if (!this.isPlaying) return;
        
        // Вызываем всех слушателей
        this.listeners.forEach(callback => {
          callback({
            type: 'beat',
            beat: beat,
            index: index,
            time: Date.now() - this.startTime
          });
        });
      }, beat.time);
    });
    
    // Планируем окончание паттерна
    const lastBeat = beats[beats.length - 1];
    setTimeout(() => {
      if (!this.isPlaying) return;
      
      // Вызываем всех слушателей
      this.listeners.forEach(callback => {
        callback({
          type: 'end',
          time: Date.now() - this.startTime
        });
      });
      
      this.isPlaying = false;
    }, lastBeat.time + 1000); // Добавляем 1 секунду после последнего удара
  }
}

// Создаем и экспортируем экземпляр менеджера ритма
const rhythmManager = new RhythmManager();

// Добавляем несколько демонстрационных паттернов
rhythmManager.addPattern('simple', [
  { time: 0, pad: 8, hit: false },     // Kick
  { time: 500, pad: 2, hit: false },   // Snare
  { time: 1000, pad: 8, hit: false },  // Kick
  { time: 1500, pad: 2, hit: false },  // Snare
  { time: 2000, pad: 8, hit: false },  // Kick
  { time: 2500, pad: 2, hit: false },  // Snare
  { time: 3000, pad: 8, hit: false },  // Kick
  { time: 3500, pad: 2, hit: false }   // Snare
], 120);

rhythmManager.addPattern('complex', [
  { time: 0, pad: 8, hit: false },     // Kick
  { time: 250, pad: 0, hit: false },   // Open Hat
  { time: 500, pad: 2, hit: false },   // Snare
  { time: 750, pad: 0, hit: false },   // Open Hat
  { time: 1000, pad: 8, hit: false },  // Kick
  { time: 1250, pad: 0, hit: false },  // Open Hat
  { time: 1500, pad: 2, hit: false },  // Snare
  { time: 1750, pad: 0, hit: false },  // Open Hat
  { time: 2000, pad: 8, hit: false },  // Kick
  { time: 2250, pad: 0, hit: false },  // Open Hat
  { time: 2500, pad: 2, hit: false },  // Snare
  { time: 2750, pad: 0, hit: false },  // Open Hat
  { time: 3000, pad: 8, hit: false },  // Kick
  { time: 3250, pad: 0, hit: false },  // Open Hat
  { time: 3500, pad: 2, hit: false },  // Snare
  { time: 3750, pad: 0, hit: false }   // Open Hat
], 120);

// Экспортируем менеджер ритма
window.rhythmManager = rhythmManager; 