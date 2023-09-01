const https = require('https')
const info = require("../info")

module.exports = () => {
    let data = JSON.stringify([info.lobbyInfo.handle])

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
            console.log(jsonData)
            let parsedData = JSON.parse( jsonData.slice(0, Math.floor(jsonData.length / 2)) + jsonData.slice(Math.floor(jsonData.length / 2) + 1, jsonData.length) )

            if (parsedData.publicHandle != null) {
                info.lobbyInfo.lobby.playerCount = (parsedData.players && parsedData.players.length) || 0
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
