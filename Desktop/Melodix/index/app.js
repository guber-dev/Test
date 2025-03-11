import { init, on, expand } from '@tma.js/sdk';

// Инициализация приложения
const miniApp = init();

// При монтировании приложения
miniApp.ready().then(() => {
  // Раскрыть на полную высоту
  expand().catch(console.error);
  
  // Обновлять высоту при изменении контента
  on('viewport_changed', () => expand());
});