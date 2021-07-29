const fs = require("fs")

module.exports = () => {
  files = fs.readdirSync("./command_modules")

  let fileList = {}

  files.forEach(file => {
    fileList[file.substring(0, file.length - 3)] = require("./command_modules/" + file)
  })

  return fileList
}