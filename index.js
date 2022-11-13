const {
    Telegraf,
    Markup,
    Scenes
} = require('telegraf');
const TSL = require('telegraf-session-local');
require('dotenv').config();
const {
    addScene
} = require('./commands/add');
const allScene = require('./commands/all');
const {
    deleteMarkdown,
    findSessionObject,
    getMessageText,
    scheduleFunction,
    messageTimerButtons,
    job
} = require('./common/functions');
const dayjs = require('dayjs');


const {
    BOT_TOKEN
} = process.env
if (BOT_TOKEN === undefined) {
    throw new Error('BOT_TOKEN must be provided!')
}

const stage = new Scenes.Stage([addScene, allScene]);
const init = async (bot, config) => {
    bot.start(ctx => {
        scheduleFunction(ctx);
        return ctx.reply('Hi')
    })

    bot.use(new TSL({
        database: 'data/session.json',
        storage: TSL.storageFileAsync,
    }).middleware());
    bot.use(scheduleFunction())
    bot.use(stage.middleware());
    bot.hears("🔍 Поиск", ctx => ctx.reply("Yay!"));
    bot.hears("➕ Добавить", ctx => ctx.scene.enter('addScene'));
    bot.hears("☸ Посмотреть все", ctx => ctx.scene.enter('all'));

    bot.command("buttons", ctx => {
        scheduleFunction(ctx);
        return ctx.reply(
            "Что вас интересует?",
            Markup.keyboard([
                ["🔍 Поиск", "➕ Добавить"],
                ["☸ Посмотреть все"],
            ])
            .oneTime()
            .resize(),
        );
    });

    bot.action('remove', (ctx) => {
        const messageText = getMessageText(ctx);
        const desiredTextKey = findSessionObject(ctx, messageText);
        delete ctx.session[desiredTextKey];
        return ctx.deleteMessage(ctx.update.callback_query.message.id)
    })

    bot.action('done', (ctx) => {
        const messageText = getMessageText(ctx);
        ctx.answerCbQuery()
        ctx.editMessageText(`${messageText} ✅`, deleteMarkdown);
        const desiredTextKey = findSessionObject(ctx, messageText);
        ctx.session[desiredTextKey] = {
            ...ctx.session[desiredTextKey],
            done: true
        };
    })

    bot.action('remind', (ctx) => {
        ctx.editMessageReplyMarkup({
            inline_keyboard: [
                [
                    Markup.button.callback('5 минут', '5_min')
                ],
                [
                    Markup.button.callback('10 минут', '10_min')
                ],
                [
                    Markup.button.callback('15 минут', '15_min')
                ],
                [
                    Markup.button.callback('30 минут', '30_min')
                ],
                [
                    Markup.button.callback('1 час', '1_hour')
                ],
                [
                    Markup.button.callback('1 день', '1_day')
                ],
                [
                    Markup.button.callback('🔙 Назад', 'backToHeadMenuWithTimer')
                ],
            ]
        })
    })

    bot.action('backToHeadMenuWithTimer', (ctx) => {
        ctx.answerCbQuery();
        ctx.editMessageReplyMarkup({
            inline_keyboard: messageTimerButtons()
        })
    })

    bot.action(/^\d{1,2}_min$/, (ctx) => {
        job.cancel();
        const messageText = getMessageText(ctx);
        const desiredTextKey = findSessionObject(ctx, messageText);
        const minutes = ctx.callbackQuery.data.split('_')[0];
        ctx.session[desiredTextKey] = {
            ...ctx.session[desiredTextKey],
            time: dayjs(ctx.session[desiredTextKey].time).add(minutes, 'minute'),
        };
        ctx.sendMessage(`Перенесено на ${minutes} минут.`)
        return ctx.callbackQuery.data = 'backToHeadMenuWithTimer';
    })

    return bot;
}

init(new Telegraf(BOT_TOKEN), process.env)
    .then(async (bot) => {
        await bot.launch()
        console.log('Bot started')
    }).catch((err) => console.log(err))

// Enable graceful stop
process.once('SIGINT', () => {
    if (job) {
        job.cancel()
    }
    return bot.stop('SIGINT');
})
process.once('SIGTERM', () => {
    if (job) {
        job.cancel()
    }
    return bot.stop('SIGTERM')
})