require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

// Эндпоинт для получения prepared_message_id
app.post('/api/prepare-share-message', async (req, res) => {
    try {
        const { user_id, referral_link } = req.body;

        if (!user_id || !referral_link) {
            return res.status(400).json({ error: 'user_id и referral_link обязательны' });
        }

        // Вызываем Telegram Bot API для сохранения подготовленного сообщения
        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/savePreparedInlineMessage`, {
            user_id: user_id,
            result: {
                type: "article",
                id: "1",
                title: "Melodix DJ Pads",
                message_text: `🎵 Присоединяйся к Melodix DJ Pads!\n\n🎮 Создавай музыку и зарабатывай бонусы!\n\n🔗 ${referral_link}`,
                parse_mode: "HTML"
            },
            allow_user_chats: true,
            allow_group_chats: true,
            allow_channel_chats: true
        });

        // Возвращаем prepared_message_id клиенту
        res.json({ prepared_message_id: response.data.result.id });
    } catch (error) {
        console.error('Error preparing share message:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to prepare share message' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 