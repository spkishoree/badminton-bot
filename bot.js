const { Client, LocalAuth } = require('whatsapp-web.js');
const cron = require('node-cron');

const GROUP_ID = process.env.GROUP_ID;
const VENUE = 'Townhall JRG';
const GAME_TIME = '3:30 PM';
const CUTOFF = '3:00 PM';
const BOT_NUMBER = process.env.BOT_NUMBER; // e.g. 919999999999

let todayPlayers = new Map();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  }
});

client.on('ready', () => console.log('Bot Ready!'));

client.on('message', async msg => {
  if (msg.from !== GROUP_ID) return;
  let text = msg.body.toLowerCase().trim();
  let name = msg._data.notifyName || 'Player';
  if (['yes','y','yeah','+1','playing','in'].includes(text)) {
    if (!todayPlayers.has(msg.author)) {
      todayPlayers.set(msg.author, name);
      msg.reply(`✅ Added ${name}! See you at ${GAME_TIME}, ${VENUE}.`);
    }
  }
  if (text === 'no' || text === 'out') {
    todayPlayers.delete(msg.author);
  }
  if (text === 'list') {
    let names = [...todayPlayers.values()];
    msg.reply(`Current List (${names.length}):\n${names.map((n,i)=> `${i+1}. ${n}`).join('\n')}`);
  }
});

cron.schedule('0 8 * * *', () => {
  client.sendMessage(GROUP_ID, `🏸 Badminton Today? - ${VENUE}\n📍 Venue: ${VENUE} | 🕐 Game: ${GAME_TIME}\nReply YES to play. Last time: ${CUTOFF}`);
}, { timezone: 'Asia/Kolkata' });

cron.schedule('0 15 * * *', () => {
  let names = [...todayPlayers.values()];
  let date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  let board = `🏸 *TODAY'S PLAYERS - ${VENUE}*\n📅 Date: ${date} | 🕐 Game: ${GAME_TIME} | 📍 Venue: ${VENUE}\n\n${names.length > 0 ? names.map((n,i)=> `✅ ${i+1}. ${n}`).join('\n') : 'No players today'}\n\nTotal: ${names.length} Players`;
  client.sendMessage(GROUP_ID, board);
  todayPlayers.clear();
}, { timezone: 'Asia/Kolkata' });

client.initialize();

// Pairing Code - for cloud login
setTimeout(async () => {
  try {
    let code = await client.requestPairingCode(BOT_NUMBER);
    console.log('PAIRING CODE:', code);
  } catch(e) { console.log('Already linked or error', e.message); }
}, 15000);