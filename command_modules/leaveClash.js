const https = require('https')
const info = require("../info")

module.exports = () => {
    let data = JSON.stringify([info.userId, info.lobbyInfo.handle])

    let options = {
        hostname: "www.codingame.com",
        path: "/services/ClashOfCode/leaveClashByHandle",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length,
            "Cookie": info.userCookie
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

    clearInterval(info.lobbyInfo.lobby.interval)
    info.lobbyInfo.lobby.interval = null
    info.lobbyInfo.lobby.timeLeft = 300000
    info.lobbyInfo.lobby.playerCount = 0
    info.lobbyInfo.lobby.firstIter = true
}