module.exports = {
    prefix: "cg!",
    token: process.env.token,
    modules: "./command_modules/",
    cookie: process.env.cookie,
    userId: process.env.userid,
    codingameLogo: "https://images.ctfassets.net/3ouphkrynjol/X0zs5QUToOY4OAssWIKiC/45499972ddf75d54b0b59b1a07594805/codingame.com.png",
    baseLink: "https://www.codingame.com/clashofcode/clash",
    availableLangs: ["Bash", "C", "C#", "C++", "Clojure", "D", "Dart", "F#", "Go", "Groovy", "Haskell", "Java", "Javascript", "Kotlin", "Lua", "ObjectiveC", "OCaml", "Pascal", "Perl", "PHP", "Ruby", "Rust", "Scala", "Swift", "TypeScript", "VB.NET", "Python3", "All"],
    availableModes: ["FASTEST", "SHORTEST", "REVERSE", "ALL"],

    lobbyInfo: {
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
}
