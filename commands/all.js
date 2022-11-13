const {
    Scenes,
    Markup
} = require('telegraf');
const {
    deleteMarkdown,
    scheduleFunction
} = require('../common/functions');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)

require('dayjs/locale/ru')
dayjs.locale('ru')

const all = new Scenes.BaseScene('all');

all.enter(ctx => {
    const sessionKeys = Object.keys(ctx.session);
    if (sessionKeys.length === 0 ||
        sessionKeys.filter(key => key !== '__scenes').length === 0) {
        return ctx.reply('🤷‍♂️ У вас пока нет сохранённых дел');
    }
    return ctx.scene.leave()
});

all.leave(ctx => {
    const sessionKeys = Object.keys(ctx.session);
    const filteredData = sessionKeys
        .filter(key => key !== '__scenes')
        .map(key => ctx.session[key]);

    return filteredData.map(({
        text,
        time,
        done
    }) => {
        if (done) {
            return ctx.reply(`${text} ✅`, deleteMarkdown)
        }

        const dayJsItemTime = dayjs(time);
        scheduleFunction(ctx);
        return ctx.reply(`
        ${text}
<b>Дата завершения:</b> ${dayJsItemTime.format('DD.MM.YYYY HH:mm')}
<b>Осталось:</b> ${dayJsItemTime.fromNow()}
        `, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                Markup.button.callback('🎉 Завершить', 'done'),
                Markup.button.callback('🗑️ Удалить', 'remove')
            ])
        })
    })
})


module.exports = all;