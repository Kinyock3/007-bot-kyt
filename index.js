const { default: makeWASocket, useMultiFileAuthState, downloadMediaMessage } = require('@whiskeysockets/baileys')
const P = require('pino')
const yts = require('yt-search')
const ytdl = require('ytdl-core')

const BOT_NAME = "𝟎𝟎𝟕"
const AUTHOR = "☛𝐊𝐘𝐓☚"
const PREFIX = "/"
const DON_NUM = "+237 673 804 138"
const WA_LINK = "wa.me/237673804138"

// Serveur pour Koyeb
require('http').createServer((req,res)=>res.end(`${BOT_NAME} by ${AUTHOR} ONLINE`)).listen(8000)

function getMenu() {
return `╔═══ 007 by ${AUTHOR} ═══╗
1️⃣ /vv - Anti vue unique
2️⃣ /play <nom> - Music/vidéo
3️⃣ /stickers - Photo->sticker
4️⃣ /don - Soutenir
5️⃣ /contact - Mon contact
╚════════════════════╝`
}

let sock
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./sessions')
  sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }), browser: [BOT_NAME, "Chrome", "1.0"] })

  if(!sock.authState.creds.registered && process.env.PHONE_NUMBER) {
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(process.env.PHONE_NUMBER.replace(/[^0-9]/g,''))
        console.log(`\n🔑 CODE PAIRING: ${code} pour ${process.env.PHONE_NUMBER}\n`)
      } catch(e){ console.log(e.message) }
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', u => { if(u.connection==='open') console.log(`✅ ${BOT_NAME} Connecté`) })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if(!m.message) return
    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
    const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ""
    const jid = m.key.remoteJid
    if(!text.startsWith(PREFIX)) return

    const cmd = text.slice(1).split(' ')[0].toLowerCase()
    const args = text.slice(PREFIX.length + cmd.length).trim()

    if(['menu','007','help','start','bot'].includes(cmd)) {
      await sock.sendMessage(jid, { text: getMenu() }, { quoted: m })
    }

    // 1️⃣ /vv
    if(cmd === 'vv') {
      if(!quoted) return sock.sendMessage(jid, { text: `❌ Réponds à une vue unique avec /vv` }, { quoted: m })
      try {
        let viewOnce = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted
        let media = viewOnce.imageMessage || viewOnce.videoMessage
        if(!media) return sock.sendMessage(jid, { text: `❌ Ce n'est pas une vue unique` }, { quoted: m })
        const buffer = await downloadMediaMessage({ message: viewOnce }, 'buffer', {}, { logger: P({level:'silent'}), reuploadRequest: sock.updateMediaMessage })
        if(media.mimetype.includes('image')) {
          await sock.sendMessage(jid, { image: buffer, caption: `✅ Anti-Vue Unique by ${AUTHOR}` }, { quoted: m })
        } else {
          await sock.sendMessage(jid, { video: buffer, caption: `✅ Anti-Vue Unique by ${AUTHOR}` }, { quoted: m })
        }
      } catch(e) {
        await sock.sendMessage(jid, { text: `Erreur vv: ${e.message}` }, { quoted: m })
      }
    }

    // 2️⃣ /play
    if(cmd === 'play') {
      if(!args) return sock.sendMessage(jid, { text: `Usage: /play Fally Ipupa - Se yo` }, { quoted: m })
      await sock.sendMessage(jid, { text: `🔍 Recherche: ${args}...` }, { quoted: m })
      try {
        const search = await yts(args)
        const video = search.videos[0]
        if(!video) return sock.sendMessage(jid, {
