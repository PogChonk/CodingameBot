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
    langs: []
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

function createClash(message, languages, modes) {
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
                    message.guild.roles.fetch("792963654709805087").then(role => {
                        if (!role) return;
                        role.setMentionable(true).then(() => {
                            message.channel.send("<@&792963654709805087>").then(() => {
                                role.setMentionable(false)
                            })
                        })
                    })
                })
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

function arrayContains(check, container) {
    for (let n = 0; n < check.length; n++) {
        if (!container.includes(check[n])) return [ false, check[n] ]
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
                message.reply("No languages specified.")
                return
            }
            if (!args[2]) {
                message.reply("No modes specified.")
                return
            }

            let languages = []
            let modes = []

            languages = args[1].split(",")
            modes = (args[2].toUpperCase()).split(",")

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

            createClash(message, languages, modes)

            break
        case "help": 
            message.channel.send(helpEmbed)
            break
        case "lobby":
            if (lobbyInfo.host && lobbyInfo.url) {
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
        default:
            break
    }
})