const chalk = require("chalk")
const { table } = require("table")

function printTitle(msg) {
  console.log(chalk.bold.red(msg))
}

function printOrderedListItem(counter, msg) {
  console.log(chalk.bold.magenta(`${counter}) `) + msg)
}

function printTable({
  cells,
}) {
  console.log(table(cells, {
    columns: {
      0: {
        alignment: 'left',
        width: 70
      },
    }}
  ))
}

function dangerText(msg) {
  return chalk.red(msg)
}

function successText(msg) {
  return chalk.green(msg)
}

module.exports = {
  printTitle,
  printOrderedListItem,
  printTable,
  dangerText,
  successText
}