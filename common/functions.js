const {
    Markup
} = require('telegraf');
const schedule = require('node-schedule');
const dayjs = require('dayjs')

exports.deleteMarkdown = {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
        Markup.button.callback('🗑️ Удалить', 'remove')
    ])
}

exports.findSessionObject = (ctx, messageText) => Object.keys(ctx.session)
    .find(key => ctx.session[key].text === messageText);

exports.getMessageText = (ctx) => ctx.callbackQuery.message.text
    .split('\n')[0]
    .split('✅')[0]
    .trim();

exports.scheduleFunction = () => async (ctx, next) => {
    // console.log(JSON.stringify(ctx.callbackQuery.data, null, '\t'));
    const scene = ctx.session['__scenes'];
    const session = ctx.session;
    const sessionWithoutScenes = Object.keys(session).filter(key => key !== '__scenes')

    if ((scene && scene.current === 'addScene' && scene.cursor === 2) || (ctx.callbackQuery && ctx.callbackQuery.data.indexOf('min') !== -1)) {
        try {
            // const fileContent = await JSON.parse(fs.readFileSync("./data/session.json", "utf8",
            //     function (error, data) {
            //         if (error) throw error;
            //     }));
            // const {
            //     sessions
            // } = fileContent;
            const times = sessionWithoutScenes.map(todoItemKey => {
                const todoTime = session[todoItemKey].time;
                return todoTime === null ? dayjs(ctx.message.text, ['DD.MM.YYYY HH:mm', 'DD.MM.YYYY', 'DD.MM.YYYY HH'], 'ru').toDate() :
                    new Date(session[todoItemKey].time);
            })

            // schedule.scheduleJob('*/10 * * * * *', () => {
            //     sessions.forEach(item => Object.keys(item.data)
            //         .filter(key => key !== '__scenes')
            //         .forEach(dataKey => {
            //             if (dayjs().isSame(dayjs(item.data[dataKey].time), 'second') &&
            //                 !item.data[dataKey].done) {
            //                 console.log("Find something!")
            //                 const {
            //                     text,
            //                     time,
            //                 } = item.data[dataKey];
            //                 const rule = new schedule.RecurrenceRule();
            //                 // rule.second = 30;
            //             schedule.scheduleJob(times, () => {
            //                 const dayJsItemTime = dayjs(time);
            //                 ctx.sendMessage(`
            //                     ${text}
            // <b>Дата завершения:</b> ${dayJsItemTime.format('DD.MM.YYYY HH:mm')}
            // <b>Осталось:</b> ${dayJsItemTime.fromNow()}
            //                     `, {
            //                     parse_mode: 'HTML',
            //                     ...Markup.inlineKeyboard(
            //                         messageTimerButtons()
            //                     )
            //                 })
            //             })
            // const times =  sessions.forEach(item => Object.keys(item.data)
            // .filter(key => key !== '__scenes')
            // .map(todoItemKey => new Date(item.data[todoItemKey].time)));

            // console.log(times)

            // schedule.scheduleJob('*/10 * * * * *', () => {
            //     sessions.forEach(item => Object.keys(item.data)
            //         .filter(key => key !== '__scenes')
            //         .forEach(dataKey => {
            //             if (dayjs().isSame(dayjs(item.data[dataKey].time), 'second') &&
            //                 !item.data[dataKey].done) {
            //                 console.log("Find something!")
            //                 const {
            //                     text,
            //                     time,
            //                 } = item.data[dataKey];
            //                 const rule = new schedule.RecurrenceRule();
            //                 // rule.second = 30;
            schedule.scheduleJob(times, () => {
                let repeatebleJob;
                sessionWithoutScenes.forEach(dataKey => {
                    const todoTime = session[dataKey].time === null ?
                        dayjs(ctx.message.text, ['DD.MM.YYYY HH:mm', 'DD.MM.YYYY', 'DD.MM.YYYY HH'], 'ru').toDate() :
                        new Date(session[dataKey].time);
                    if (dayjs().isSame(dayjs(todoTime), 'second') &&
                        !session[dataKey].done) {
                        repeatebleJob = schedule.scheduleJob('*/10 * * * * *', () => {
                            const {
                                text,
                            } = session[dataKey];
                            const dayJsItemTime = dayjs(todoTime);
                            ctx.sendMessage(`
                                ${text}
<b>Дата завершения:</b> ${dayJsItemTime.format('DD.MM.YYYY HH:mm')}
<b>Осталось:</b> ${dayJsItemTime.fromNow()}
                                `, {
                                parse_mode: 'HTML',
                                ...Markup.inlineKeyboard(
                                    messageTimerButtons()
                                )
                            })
                        })
                        console.log(repeatebleJob)
                        console.log((ctx.callbackQuery && ctx.callbackQuery.data.indexOf('min') !== -1))
                        if ((ctx.callbackQuery && ctx.callbackQuery.data.indexOf('min') !== -1)) {
                            console.log("inner if ", repeatebleJob)
                            repeatebleJob.cancel();
                        }
                    }
                })
            })
        }
        // }))
        // })
        // }
        catch (e) {
            console.log("some error: " + e);
        }
    }
    return next();
}

const messageTimerButtons = exports.messageTimerButtons = () => [
    [
        Markup.button.callback('🎉 Завершить', 'done'),
        Markup.button.callback('🗑️ Удалить', 'remove'),
    ],
    [Markup.button.callback('💤 Отложить', 'remind')]
]