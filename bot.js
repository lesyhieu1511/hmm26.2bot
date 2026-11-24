
const mineflayer = require('mineflayer')

const servers = [
  {
    name: 'SERVER 1',
    host: '51.79.228.227',
    port: 11980,
    username: '___',
    password: 'hieu1511h1'
  },
  {
    name: 'SERVER 2',
    host: '51.79.228.227',
    port: 11171,
    username: '___',
    password: 'hieu1511h1',
    reconnectDelay: 1000
  },
  {
    name: 'SERVER 3',
    host: 'luckyhaven946.mcsh.gg',
    port: 25565,
    username: '___',
    password: 'hieu1511h1',
    autoRestart: false,
    stayTime: 5 * 60 * 1000
  }
]

const RECONNECT_DELAY = 5000
const LOGIN_DELAY = 1000

function startBot(server) {
  let reconnecting = false
  let reconnectTimer = null

  function connect() {
    console.log(`[${server.name}] Dang ket noi...`)

    let bot
    let loggedIn = false
    let loginTimer = null
    let restartTimer = null
    let ended = false

    function login() {
      if (!server.password || loggedIn || ended) return
      if (!bot || !bot.player) return

      loggedIn = true

      if (loginTimer) {
        clearTimeout(loginTimer)
        loginTimer = null
      }

      bot.chat(`/login ${server.password}`)
      console.log(`[${server.name}] Da gui lenh login`)
    }

    try {
      bot = mineflayer.createBot({
        host: server.host,
        port: server.port,
        username: server.username,
        auth: 'offline',
        version: '26.2'
      })
    } catch (err) {
      console.error(`[${server.name}] Loi tao bot:`, err.message)
      scheduleReconnect()
      return
    }

    bot.on('messagestr', (message) => {
      if (!server.password || loggedIn || ended) return

      console.log(`[${server.name}] Tin nhan: ${message}`)

      const msg = message.toLowerCase()

      // Session da hop le, khong can login
      if (
        msg.includes('valid session') ||
        msg.includes('no need to log in')
      ) {
        loggedIn = true

        if (loginTimer) {
          clearTimeout(loginTimer)
          loginTimer = null
        }

        console.log(`[${server.name}] Session hop le, bo qua login`)
        return
      }

      // Server yeu cau dang nhap
      if (
        msg.includes('/login') ||
        msg.includes('please login') ||
        msg.includes('please log in') ||
        msg.includes('dang nhap') ||
        msg.includes('đăng nhập') ||
        msg.includes('authentication')
      ) {
        login()
      }
    })

    bot.once('spawn', () => {
      console.log(
        `[${server.name}] Da vao server tai`,
        bot.entity.position
      )

      if (server.password) {
        loginTimer = setTimeout(login, LOGIN_DELAY)
      }

      // Chi SERVER 3 moi tu dong thoat sau 5 phut
      if (server.autoRestart) {
        restartTimer = setTimeout(() => {
          console.log(`[${server.name}] Da du 5 phut, dang thoat...`)
          bot.quit('Restart after 5 minutes')
        }, server.stayTime)
      }
    })

    bot.on('kicked', (reason) => {
      console.log(`[${server.name}] Bi kick:`, reason)
    })

    bot.on('error', (err) => {
      console.error(`[${server.name}] Loi:`, err.message)
    })

    bot.once('end', (reason) => {
      ended = true

      if (loginTimer) {
        clearTimeout(loginTimer)
        loginTimer = null
      }

      if (restartTimer) {
        clearTimeout(restartTimer)
        restartTimer = null
      }

      console.log(
        `[${server.name}] Mat ket noi:`,
        reason || 'Khong ro nguyen nhan'
      )

      scheduleReconnect()
    })
  }

  function scheduleReconnect() {
    if (reconnecting) return

    reconnecting = true

    const delay = server.reconnectDelay || RECONNECT_DELAY

    console.log(
      `[${server.name}] Thu ket noi lai sau ${delay / 1000} giay...`
    )

    reconnectTimer = setTimeout(() => {
      reconnecting = false
      reconnectTimer = null
      connect()
    }, delay)
  }

  connect()
}

for (const server of servers) {
  startBot(server)
}