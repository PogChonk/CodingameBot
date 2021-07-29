module.exports = (check, container) => {
    for (let n = 0; n < check.length; n++) {
        if (!container.includes(check[n])) {
            return [ false, check[n] ]
        }
    }
    return [ true ]
}