const https = require('https')
const info = require("../info")

module.exports = (message, publicHandle) => {
    let data = JSON.stringify([publicHandle])

    let options = {
        hostname: "www.codingame.com",
        path: "/services/ClashOfCode/findClashByHandle",
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
                info.lobbyInfo.online.started = parsedData.started
                info.lobbyInfo.online.finished = parsedData.finished
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