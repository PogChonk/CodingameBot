const Discord = require("discord.js")
const prefix = "cg!"
const token = process.env.token
const bot = new Discord.Client()

const https = require('https')
const userCookie = process.env.cookie
const userId = process.env.userid

const codingameLogo = "https://images.ctfassets.net/3ouphkrynjol/X0zs5QUToOY4OAssWIKiC/45499972ddf75d54b0b59b1a07594805/codingame.com.png"
const baseLink = "https://www.codingame.com/clashofcode/clash/"

const lobbyInfo = {
    host: "",
    url: "",
    date: 0,
    modes: [],
    langs: [],
    handle: "",
    lobby: {
        firstIter: true,
        playerCount: 0,
        interval: null,
        count: 1000,
        timeLeft: 300000
    },
    online: {
        started: false,
        finished: false
    }
}

const availableLangs = ["Bash", "C", "C#", "C++", "Clojure", "D", "Dart", "F#", "Go", "Groovy", "Haskell", "Java", "Javascript", "Kotlin", "Lua", "ObjectiveC", "OCaml", "Pascal", "Perl", "PHP", "Ruby", "Rust", "Scala", "Swift", "TypeScript", "VB.NET", "Python3"]
const availableModes = ["FASTEST", "SHORTEST", "REVERSE"]

const helpEmbed = new Discord.MessageEmbed()
            .setColor("#00e5ff")
            .setTitle("Bot Help")
            .addField("Commands", "create, lobby")
            .addField("Usages", "cg!create languages<array> modes<array>\nCreates a new Codingame lobby with the specified language(s) and mode(s).\n\ncg!lobby\nCheck if there's a current game going on.")
            .addField("Examples", "cg!create Lua,C++ Fastest,Reverse\ncg!lobby")
            .addField("\u200B", "\u200B")
            .addField("Options", `**Modes**: ${availableModes.join(", ")}\n\n**Languages**: ${availableLangs.join(", ")}`)
            .setTimestamp(new Date().getTime())

function getClashPlayers() {
    let data = JSON.stringify([lobbyInfo.handle])

    let options = {
        hostname: "www.codingame.com",
        path: "/services/ClashOfCode/findClashByHandle",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length,
            "Cookie": userCookie
        }
    }

    let req = https.request(options, result => {
        result.on("data", jsonData => {
            let parsedData = JSON.parse(jsonData)

            if (parsedData.publicHandle != null) {
                lobbyInfo.lobby.playerCount = (parsedData.players && parsedData.players.length) || 0
            }
        })
    })

    req.on("error", e => {
        console.log("There was an error retrieving the private Clash of Code players!")
        console.log(e)
    })

    req.write(data)
    req.end()
}

function leaveClash() {
    let data = JSON.stringify([userId, lobbyInfo.handle])

    let options = {
        hostname: "www.codingame.com",
        path: "/services/ClashOfCode/leaveClashByHandle",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length,
            "Cookie": userCookie
        }
    }

    let req = https.request(options, result => {
        result.on("data", () => {})
    })

    req.on("error", e => {
        console.log("There was an error leaving the lobby!")
        console.log(e)
    })

    req.write(data)
    req.end()

    clearInterval(lobbyInfo.lobby.interval)
    lobbyInfo.lobby.interval = null
    lobbyInfo.lobby.timeLeft = 300000
    lobbyInfo.lobby.playerCount = 0
    lobbyInfo.lobby.firstIter = true
}

function createClash(message, languages, modes, ping) {
    let data = JSON.stringify([userId, {SHORT: true}, languages, modes])

    let options = {
        hostname: "www.codingame.com",
        path: "/services/ClashOfCode/createPrivateClash",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length,
            "Cookie": userCookie
        }
    }

    let req = https.request(options, result => {
        result.on("data", jsonData => {
            let parsedData = JSON.parse(jsonData)

            if (parsedData.publicHandle != null) {
                lobbyInfo.date = new Date().getTime()
                lobbyInfo.host = message.member.nickname || message.author.username
                lobbyInfo.url = baseLink + parsedData.publicHandle
                lobbyInfo.modes = modes
                lobbyInfo.langs = languages
                lobbyInfo.handle = parsedData.publicHandle
                lobbyInfo.online.finished = false
                lobbyInfo.online.started = false

                for (let i = 0; i < lobbyInfo.modes.length; i++) {
                    let element = modes[i]
                    let firstChar = element.substr(0, 1)
                    let restChars = element.substr(1, element.length)
                    modes[i] = firstChar.toUpperCase() + restChars.toLowerCase()
                }

                let linkEmbed = new Discord.MessageEmbed()
                .setTitle("Codingame Lobby")
                .addField("Hosted by", lobbyInfo.host)
                .addField("Join via", `*[Codingame](${lobbyInfo.url})*`)
                .addField("\u200B", "\u200B")
                .addField("Mode(s)", lobbyInfo.modes.join(", "), true)
                .addField("Languages(s)", lobbyInfo.langs.join(", "), true)
                .setColor("#00e5ff")
                .setThumbnail(codingameLogo)
                .setTimestamp(lobbyInfo.date)

                message.channel.send(linkEmbed).then(() => {
                    if (ping) {
                        message.guild.roles.fetch("792963654709805087").then(role => {
                            if (!role) return;
                            role.setMentionable(true).then(() => {
                                message.channel.send("<@&792963654709805087>").then(() => {
                                    role.setMentionable(false)
                                })
                            })
                        })
                    }
                })

                if (lobbyInfo.lobby.interval) {
                    clearInterval(lobbyInfo.lobby.interval)
                    lobbyInfo.lobby.interval = null
                    lobbyInfo.lobby.timeLeft = 300000
                    lobbyInfo.lobby.playerCount = 0
                    lobbyInfo.lobby.firstIter = true
                }

                lobbyInfo.lobby.interval = setInterval(() => {
                    if (lobbyInfo.lobby.firstIter) {
                        lobbyInfo.lobby.timeLeft = 300000
                        lobbyInfo.lobby.playerCount = 0
                        lobbyInfo.lobby.firstIter = false
                    } else {
                        getClashPlayers()
                    }
                    if (lobbyInfo.lobby.playerCount > 1 || lobbyInfo.lobby.timeLeft <= 0) {
                        leaveClash()
                        return
                    }
                    lobbyInfo.lobby.timeLeft -= lobbyInfo.lobby.count
                }, lobbyInfo.lobby.count)
            } else {
                message.reply("Something went wrong! Make sure there are no spaces between the commas for the languages and modes and double-check your spelling (Case-sensitive for the languages)!")
                console.log(parsedData)
            }
        })
    })

    req.on("error", e => {
        message.reply("There was an error creating a private Clash of Code lobby!")
        console.log(e)
    })

    req.write(data)
    req.end()
}

function getClashInfo(message, publicHandle) {
    let data = JSON.stringify([publicHandle])

    let options = {
        hostname: "www.codingame.com",
        path: "/services/ClashOfCode/findClashByHandle",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length,
            "Cookie": userCookie
        }
    }

    let req = https.request(options, result => {
        result.on("data", jsonData => {
            let parsedData = JSON.parse(jsonData)

            if (parsedData.publicHandle != null) {
                lobbyInfo.online.started = parsedData.started
                lobbyInfo.online.finished = parsedData.finished
            }
        })
    })

    req.on("error", e => {
        message.reply("There was an error retrieving the private Clash of Code information!")
        console.log(e)
    })

    req.write(data)
    req.end()
}

function arrayContains(check, container) {
    for (let n = 0; n < check.length; n++) {
        if (!container.includes(check[n])) {
            return [ false, check[n] ]
        }
    }
    return [ true ]
}

bot.login(token)

bot.on("ready", () => {
    bot.user.setActivity('www.codingame.com', {type: 'PLAYING'})
})

bot.on("message", message => {
    let args = message.content.split(" ")
    let cmd = args[0]

    if (!cmd.startsWith(prefix)) return

    switch(cmd.substring(prefix.length).toLowerCase()) {
        case "create":
            if (!message.member.roles.cache.some(role => role.name === "Codingame Host")) return

            if (!args[1]) {
                message.reply("No language(s) specified.")
                return
            }
            if (!args[2]) {
                message.reply("No mode(s) specified.")
                return
            }

            let ping = false
            args[3] = (args[3] && args[3].toLowerCase()) || ""

            if (args[3] == "true") {
                ping = true
            } else {
                ping = false
            }

            let languages = args[1].split(",")
            let modes = (args[2].toUpperCase()).split(",")

            let [ langBool, langElement ] = arrayContains(languages, availableLangs)
            if (!langBool) {
                message.reply(`Invalid language(s)! ${langElement} is an invalid language.`)
                return
            }

            let [ modeBool, modeElement ] = arrayContains(modes, availableModes)
            if (!modeBool) {
                message.reply(`Invalid mode(s)! ${modeElement} is an invalid mode.`)
                return
            }

            createClash(message, languages, modes, ping)
            break
        case "help": 
            message.channel.send(helpEmbed)
            break
        case "lobby":
            if (lobbyInfo.host && lobbyInfo.url) {
                getClashInfo(message, lobbyInfo.handle)
                if ((!lobbyInfo.online.started && !lobbyInfo.online.finished) || (lobbyInfo.online.started && !lobbyInfo.online.finished)) {
                    let lobbyEmbed = new Discord.MessageEmbed()
                    .setTitle("Codingame Lobby")
                    .addField("Hosted by", lobbyInfo.host)
                    .addField("Join via", `*[Codingame](${lobbyInfo.url})*`)
                    .addField("\u200B", "\u200B")
                    .addField("Mode(s)", lobbyInfo.modes.join(", "), true)
                    .addField("Languages(s)", lobbyInfo.langs.join(", "), true)
                    .setColor("#00e5ff")
                    .setThumbnail(codingameLogo)
                    .setTimestamp(lobbyInfo.date)

                    message.reply(lobbyEmbed)
                } else {
                    message.reply("There's no active lobby!")
                }
            } else {
                message.reply("There's no active lobby!")
            }
            break
        default:
            break
    }
})