const Discord = require("discord.js")
const prefix = "cg!"
const bot = new Discord.Client()

const https = require('https')
const userCookie = process.env.cookie
const userId = process.env.userid

const availableLangs = ["Bash", " C", " C#", " C++", " Clojure", " D", " Dart", " F#", " Go", " Groovy", " Haskell", " Java", " JavaScript", " Kotlin", " Lua", " Objective-C", " OCaml", " Pascal", " Perl", " PHP", " Ruby", " Rust", " Scala", " Swift", " TypeScript", " VB.NET"]
const availableModes = [" FASTEST", " SHORTEST", " REVERSE"]

const helpEmbed = new Discord.MessageEmbed()
            .setColor("#00e5ff")
            .setTitle("How to generate a link")
            .addField("Command", "cg!create languages<array> modes<array>")
            .addField("Example usage", "cg!create Lua,C++ Fastest,Shortest")
            .addField("\u200B", "\u200B")
            .addField("Options", `**Modes**: ${availableModes.toString()}\n\n**Languages**: ${availableLangs.toString()}`)

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

    let baseLink = "https://www.codingame.com/clashofcode/clash/"

    let req = https.request(options, result => {
        result.on("data", jsonData => {
            let parsedData = JSON.parse(jsonData)

            if (parsedData.publicHandle != null) {
                message.reply(`Created a lobby!\nJoin via ${baseLink + parsedData.publicHandle}\nMode(s): ${modes.toString()}\nLanguage(s): ${languages.toString()}`).then(msg => {
                    msg.suppressEmbeds(true)
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
        if (!container.includes(check[n])) {
            if (!container.includes(" " + check[n])) return [ false, check[n] ]
        }
    }
    return [ true ]
}

bot.login(process.env.token)

bot.on("ready", () => {
    bot.user.setActivity('www.codingame.com', {type: 'PLAYING'})
})

bot.on("message", message => {
    let args = message.content.split(" ")
    let cmd = args[0]

    if (!cmd.startsWith(prefix)) return

    switch(cmd.substring(prefix.length).toLowerCase()) {
        case "create":
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
        default:
            break
    }
})