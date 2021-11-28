const Discord = require("discord.js")
const https = require('https')
const info = require("../info")
const modules = require("../unpackModules")()

module.exports = (message, languages, modes, ping) => {
    let newLang = null
    let newMode = null
    if (languages[0] == "All") newLang = []
    if (modes[0] == "ALL") newMode = ["FASTEST", "SHORTEST", "REVERSE"]

    let data = JSON.stringify([info.userId, newLang || languages, newMode || modes])

    let options = {
        hostname: "www.codingame.com",
        path: "/services/ClashOfCode/createPrivateClash",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length,
            "Cookie": info.userCookie
        }
    }

    let req = https.request(options, result => {
        result.on("data", jsonData => {
            let parsedData = JSON.parse(jsonData)

            if (parsedData.publicHandle != null) {
                info.lobbyInfo.date = new Date().getTime()
                info.lobbyInfo.host = message.member.nickname || message.author.username
                info.lobbyInfo.url = info.baseLink + parsedData.publicHandle
                info.lobbyInfo.modes = modes
                info.lobbyInfo.langs = languages
                info.lobbyInfo.handle = parsedData.publicHandle
                info.lobbyInfo.online.finished = false
                info.lobbyInfo.online.started = false

                for (let i = 0; i < info.lobbyInfo.modes.length; i++) {
                    let element = modes[i]
                    let firstChar = element.substr(0, 1)
                    let restChars = element.substr(1, element.length)
                    modes[i] = firstChar.toUpperCase() + restChars.toLowerCase()
                }

                let linkEmbed = new Discord.MessageEmbed()
                .setTitle("Codingame Lobby")
                .addField("Hosted by", info.lobbyInfo.host)
                .addField("Join via", `*[Codingame](${info.lobbyInfo.url})*`)
                .addField("\u200B", "\u200B")
                .addField("Mode(s)", info.lobbyInfo.modes.join(", "), true)
                .addField("Languages(s)", info.lobbyInfo.langs.join(", "), true)
                .setColor("#00e5ff")
                .setThumbnail(info.codingameLogo)
                .setTimestamp(info.lobbyInfo.date)

                message.channel.send(linkEmbed).then(() => {
                    if (ping) {
                        message.guild.roles.fetch("792963654709805087").then(role => {
                            if (!role) return;
                            role.setMentionable(true).then(() => {
                                message.channel.send("<@&792963654709805087> - Codingame Time! \nIf you are upset about this ping, you can do any of the following:\n`1)` Remove the `Codingame Player` role by heading on over to <#424636584609054721> and using the command `/role category:Extras`\n`2)` Ignore it and supress pings from this channel and/or server \n`3)` Cry").then(msg => {
                                    role.setMentionable(false)
                                    msg.react("😭")
                                })
                            })
                        })
                    }
                })

                if (info.lobbyInfo.lobby.interval) {
                    clearInterval(info.lobbyInfo.lobby.interval)
                    info.lobbyInfo.lobby.interval = null
                    info.lobbyInfo.lobby.timeLeft = 300000
                    info.lobbyInfo.lobby.playerCount = 0
                    info.lobbyInfo.lobby.firstIter = true
                }

                info.lobbyInfo.lobby.interval = setInterval(() => {
                    if (info.lobbyInfo.lobby.firstIter) {
                        info.lobbyInfo.lobby.timeLeft = 300000
                        info.lobbyInfo.lobby.playerCount = 0
                        info.lobbyInfo.lobby.firstIter = false
                    } else {
                        modules.getClashPlayers()
                    }
                    if (info.lobbyInfo.lobby.playerCount > 1 || info.lobbyInfo.lobby.timeLeft <= 0) {
                        modules.leaveClash()
                        return
                    }
                    info.lobbyInfo.lobby.timeLeft -= info.lobbyInfo.lobby.count
                }, info.lobbyInfo.lobby.count)
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
