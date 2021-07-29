const Discord = require("discord.js")
const info = require("./info")
const modules = require("./unpackModules")()
const bot = new Discord.Client()

const helpEmbed = new Discord.MessageEmbed()
            .setColor("#00e5ff")
            .setTitle("Bot Help")
            .addField("Commands", "create, lobby")
            .addField("Usages", "cg!create languages<array> modes<array> ping<boolean>[Optional]\nCreates a new Codingame lobby with the specified language(s) and mode(s)\n\n**Note**: The ***ping*** argument is completely optional. If it is not specified or false it will not ping players, if it is true then it will ping the `Codingame Player` role.\n\n\ncg!lobby\nCheck if there's a current game going on.")
            .addField("Examples", "cg!create Lua,C++ Fastest,Reverse true\ncg!lobby")
            .addField("\u200B", "\u200B")
            .addField("Options", `**Modes**: ${info.availableModes.join(", ")}\n\n**Languages**: ${info.availableLangs.join(", ")}`)
            .setTimestamp(new Date().getTime())

bot.login(info.token)

bot.on("ready", () => {
    bot.user.setActivity('www.codingame.com', {type: 'PLAYING'})
})

bot.on("message", message => {
    let args = message.content.split(" ")
    let cmd = args[0]

    if (!cmd.startsWith(info.prefix)) return

    switch(cmd.substring(info.prefix.length).toLowerCase()) {
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

            let [ langBool, langElement ] = modules.arrayContains(languages, info.availableLangs)
            if (!langBool) {
                message.reply(`Invalid language(s)! ${langElement} is an invalid language.`)
                return
            }

            let [ modeBool, modeElement ] = modules.arrayContains(modes, info.availableModes)
            if (!modeBool) {
                message.reply(`Invalid mode(s)! ${modeElement} is an invalid mode.`)
                return
            }

            modules.createClash(message, languages, modes, ping)
            break
        case "help": 
            message.channel.send(helpEmbed)
            break
        case "lobby":
            if (info.lobbyInfo.host && info.lobbyInfo.url) {
                modules.getClashInfo(message, info.lobbyInfo.handle)
                if ((!info.lobbyInfo.online.started && !info.lobbyInfo.online.finished) || (info.lobbyInfo.online.started && !info.lobbyInfo.online.finished)) {
                    let lobbyEmbed = new Discord.MessageEmbed()
                    .setTitle("Codingame Lobby")
                    .addField("Hosted by", info.lobbyInfo.host)
                    .addField("Join via", `*[Codingame](${info.lobbyInfo.url})*`)
                    .addField("\u200B", "\u200B")
                    .addField("Mode(s)", info.lobbyInfo.modes.join(", "), true)
                    .addField("Languages(s)", info.lobbyInfo.langs.join(", "), true)
                    .setColor("#00e5ff")
                    .setThumbnail(info.codingameLogo)
                    .setTimestamp(info.lobbyInfo.date)

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