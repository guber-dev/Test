/// <reference path="../types.d.ts" />

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "http/server.ts"

// Добавляем типы для Deno
declare global {
  interface Window {
    crypto: Crypto;
  }
  var crypto: Crypto;
}

// Объявляем namespace для Deno
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShareMessageRequest {
  user_id: number;
  referral_link: string;
}

interface TelegramResponse {
  ok: boolean;
  result?: {
    id: string;
  };
  error_code?: number;
  description?: string;
}

console.log("Hello from Functions!")

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Проверяем метод
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Получаем и валидируем данные
    const { user_id, referral_link } = await req.json() as ShareMessageRequest

    if (!user_id || typeof user_id !== 'number') {
      throw new Error('user_id должен быть числом')
    }

    if (!referral_link || !referral_link.startsWith('https://t.me/')) {
      throw new Error('Некорректная реферальная ссылка')
    }

    // Получаем токен бота
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN не найден')
    }

    // Вызываем Telegram Bot API v6.9
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/savePreparedInlineMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id,
          result: {
            type: 'article',
            id: crypto.randomUUID(),
            title: '🎵 Melodix DJ Pads',
            message_text: `🎵 Присоединяйся к Melodix DJ Pads!\n\n🎮 Создавай музыку и зарабатывай бонусы!\n\n${referral_link}`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{
                  text: '🎵 Открыть Melodix DJ Pads',
                  url: referral_link
                }]
              ]
            }
          },
          allow_user_chats: true,
          allow_group_chats: true,
          allow_channel_chats: true
        })
      }
    )

    const result = await response.json() as TelegramResponse

    if (!result.ok) {
      throw new Error(result.description || 'Telegram API error')
    }

    return new Response(
      JSON.stringify({ prepared_message_id: result.result?.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error instanceof Error && error.message === 'Method not allowed' ? 405 : 500
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:0/functions/v1/prepare-share-message' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
