// Реферальная система для Melodix DJ Pads
// Использует Supabase для хранения данных

// Инициализация Supabase клиента
// ВАЖНО: Замените эти значения на ваши реальные данные из проекта Supabase
const SUPABASE_URL = 'https://ljeiynmocwcltbzhktqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZWl5bm1vY3djbHRiemhrdHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNDEzMjUsImV4cCI6MjA1NzcxNzMyNX0.6_cFfP43_6YCdFtEnoezNPqbYGQGZ1O6UdVP-nHonlU';

// Создаем клиент Supabase
let supabase;
try {
    // Правильная инициализация клиента Supabase
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase клиент успешно инициализирован');
} catch (error) {
    console.error('Ошибка при инициализации Supabase:', error);
}

// Класс для работы с реферальной системой
class ReferralSystem {
    constructor() {
        this.currentUser = null;
        this.referralCode = null;
    }

    // Инициализация системы
    async init() {
        try {
            // Проверяем, есть ли данные пользователя из Telegram
            const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
            if (!telegramUser) {
                console.warn('Данные пользователя Telegram недоступны');
                return false;
            }

            // Получаем или создаем пользователя в базе данных
            this.currentUser = await this.getOrCreateUser(telegramUser);
            
            // Проверяем наличие реферального кода в tgWebAppStartParam
            const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
            if (startParam) {
                console.log('Получен start_param:', startParam);
                await this.processReferral(startParam);
            }
            
            return true;
        } catch (error) {
            console.error('Ошибка при инициализации реферальной системы:', error);
            return false;
        }
    }

    // Получение или создание пользователя в базе данных
    async getOrCreateUser(telegramUser) {
        try {
            // Проверяем, существует ли пользователь
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('telegram_id', telegramUser.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            if (existingUser) {
                console.log('Пользователь найден:', existingUser);
                this.referralCode = existingUser.referral_code;
                return existingUser;
            }

            // Создаем нового пользователя
            const newReferralCode = this.generateReferralCode(telegramUser.id);
            const newUser = {
                telegram_id: telegramUser.id,
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name || '',
                username: telegramUser.username || '',
                photo_url: telegramUser.photo_url || '',
                referral_code: newReferralCode,
                points: 0,
                created_at: new Date()
            };

            const { data: createdUser, error: insertError } = await supabase
                .from('users')
                .insert([newUser])
                .select()
                .single();

            if (insertError) throw insertError;

            console.log('Создан новый пользователь:', createdUser);
            this.referralCode = newReferralCode;
            return createdUser;
        } catch (error) {
            console.error('Ошибка при получении/создании пользователя:', error);
            return null;
        }
    }

    // Генерация уникального реферального кода
    generateReferralCode(userId) {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `ref_${userId}_${timestamp}_${randomStr}`;
    }

    // Проверка наличия реферального кода в URL
    checkReferralCodeInUrl() {
        try {
            // Получаем start_param из Telegram WebApp
            const refCode = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
            console.log('Получен реферальный код из WebApp:', refCode);
            
            if (refCode && this.currentUser) {
                // Если код найден и не принадлежит текущему пользователю
                if (refCode !== this.currentUser.referral_code) {
                    this.processReferral(refCode);
                }
            }
        } catch (error) {
            console.error('Ошибка при проверке реферального кода:', error);
        }
    }

    // Обработка реферальной ссылки
    async processReferral(referralCode) {
        try {
            // Проверяем, существует ли пользователь с таким кодом
            const { data: referrer, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('referral_code', referralCode)
                .single();

            if (fetchError) {
                console.error('Ошибка при поиске пригласившего пользователя:', fetchError);
                return false;
            }

            // Проверяем, не была ли уже использована эта реферальная связь
            const { data: existingReferral, error: checkError } = await supabase
                .from('referrals')
                .select('*')
                .eq('referrer_id', referrer.id)
                .eq('referred_id', this.currentUser.id)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Ошибка при проверке существующей реферальной связи:', checkError);
                return false;
            }

            if (existingReferral) {
                console.log('Реферальная связь уже существует');
                return false;
            }

            // Создаем новую реферальную связь
            const newReferral = {
                referrer_id: referrer.id,
                referred_id: this.currentUser.id,
                referral_code: referralCode,
                status: 'completed',
                created_at: new Date()
            };

            const { error: insertError } = await supabase
                .from('referrals')
                .insert([newReferral]);

            if (insertError) {
                console.error('Ошибка при создании реферальной связи:', insertError);
                return false;
            }

            // Начисляем бонусы пригласившему пользователю
            const { error: updateError } = await supabase
                .from('users')
                .update({ points: referrer.points + 50 })
                .eq('id', referrer.id);

            if (updateError) {
                console.error('Ошибка при начислении бонусов:', updateError);
            }

            console.log('Реферальная связь успешно создана, бонусы начислены');
            return true;
        } catch (error) {
            console.error('Ошибка при обработке реферальной ссылки:', error);
            return false;
        }
    }

    // Получение реферальной ссылки текущего пользователя
    getReferralLink() {
        if (!this.currentUser || !this.referralCode) {
            return null;
        }
        // Используем формат для открытия мини-приложения с параметром startapp
        return `https://t.me/MelodixCryptoBot/app?startapp=${this.referralCode}`;
    }

    // Получение статистики приглашений
    async getReferralStats() {
        if (!this.currentUser) {
            return { invited: 0, points: 0 };
        }

        try {
            // Получаем количество приглашенных пользователей
            const { data: referrals, error: countError, count } = await supabase
                .from('referrals')
                .select('*', { count: 'exact' })
                .eq('referrer_id', this.currentUser.id);

            if (countError) {
                console.error('Ошибка при получении статистики приглашений:', countError);
                return { invited: 0, points: this.currentUser.points || 0 };
            }

            return {
                invited: count || 0,
                points: this.currentUser.points || 0
            };
        } catch (error) {
            console.error('Ошибка при получении статистики приглашений:', error);
            return { invited: 0, points: this.currentUser.points || 0 };
        }
    }

    // Шаринг через URL
    async shareReferralLink() {
        const referralLink = this.getReferralLink();
        
        if (!referralLink) {
            console.error('Не удалось получить реферальную ссылку');
            return false;
        }

        try {
            const text = `🎵 Присоединяйся к Melodix DJ Pads!\n\nСоздавай биты и зарабатывай бонусы!`;
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
            
            window.open(shareUrl, '_blank');
            return true;
        } catch (error) {
            console.error('Ошибка при создании share URL:', error);
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert(`Ошибка: ${error.message}`);
            }
            return false;
        }
    }
}

// Создаем глобальный экземпляр реферальной системы
window.referralSystem = new ReferralSystem();

// Инициализируем реферальную систему при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
    // Инициализация будет выполнена после загрузки данных пользователя
    setTimeout(async () => {
        await window.referralSystem.init();
        console.log('Реферальная система инициализирована');
        
        // Обновляем статистику в профиле
        updateReferralStats();

        // Инициализируем обработчик кнопки шаринга
        const shareUrlButton = document.getElementById('share-url-btn');
        if (shareUrlButton) {
            shareUrlButton.addEventListener('click', async function() {
                if (window.referralSystem) {
                    await window.referralSystem.shareReferralLink();
                } else {
                    console.error('Реферальная система не инициализирована');
                    if (window.Telegram?.WebApp?.showAlert) {
                        window.Telegram.WebApp.showAlert('Не удалось создать ссылку. Попробуйте позже.');
                    }
                }
            });
        }
    }, 1000);
});

// Функция для обновления статистики в профиле
async function updateReferralStats() {
    try {
        const stats = await window.referralSystem.getReferralStats();
        
        // Обновляем количество очков
        const pointsElement = document.querySelector('.profile-stats .stat-item:first-child .stat-value');
        if (pointsElement) {
            pointsElement.textContent = stats.points;
        }
        
        // Обновляем количество приглашенных друзей
        const achievementsElement = document.querySelector('.profile-stats .stat-item:last-child .stat-value');
        if (achievementsElement) {
            achievementsElement.textContent = stats.invited;
        }
        
        console.log('Статистика реферальной системы обновлена:', stats);
    } catch (error) {
        console.error('Ошибка при обновлении статистики:', error);
    }
}
