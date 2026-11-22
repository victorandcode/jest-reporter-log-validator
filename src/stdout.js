const { table } = require("table")

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
}

const colorEnabled = Boolean(
  process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb",
)

function style(codes, msg) {
  const text = String(msg)
  if (!colorEnabled) {
    return text
  }
  return `${codes.join("")}${text}${ANSI.reset}`
}

function printTitle(msg) {
  console.log(style([ANSI.bold, ANSI.red], msg))
}

function printOrderedListItem(counter, msg) {
  console.log(style([ANSI.bold, ANSI.magenta], `${counter}) `) + msg)
}

function printTable({ cells }) {
  console.log(
    table(cells, {
      columns: {
        0: {
          alignment: "left",
          width: 70,
        },
      },
    }),
  )
}

function dangerText(msg) {
  return style([ANSI.red], msg)
}

function successText(msg) {
  return style([ANSI.green], msg)
}

module.exports = {
  printTitle,
  printOrderedListItem,
  printTable,
  dangerText,
  successText,
}
