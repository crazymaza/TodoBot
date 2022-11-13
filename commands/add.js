const {
  Scenes
} = require('telegraf');
const {
  findSessionObject,
  scheduleFunction,
} = require('../common/functions');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

let messageText = null;

exports.addScene = new Scenes.WizardScene('addScene',
  (ctx) => {
    ctx.sendMessage('✍️ Введите название дела');
    return ctx.wizard.next();
  },
  (ctx) => {
    messageText = ctx.message.text;
    const messageId = ctx.message.message_id;
    if (messageText.trim().length === 0) {
      return ctx.sendMessage('Вы ничего не ввели');
    }
    ctx.session[messageId] = {
      text: messageText,
      done: false,
      time: null
    };
    ctx.sendMessage('⏰ Введите дату завершения, например 10.10.2020 12:00');
    return ctx.wizard.next();
  },
  (ctx) => {
    const desiredTextKey = findSessionObject(ctx, messageText);
    ctx.session[desiredTextKey] = {
      ...ctx.session[desiredTextKey],
      time: dayjs(ctx.message.text, ['DD.MM.YYYY HH:mm', 'DD.MM.YYYY', 'DD.MM.YYYY HH'], 'ru')
    };
    ctx.sendMessage('🆗 Записал');
    return ctx.scene.leave();
  },
);