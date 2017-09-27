const agent = require('superagent')
const IlpAgent = require('superagent-ilp')
const debug = require('debug')('ilp-curl')


const Plugin = require(process.env.ILP_PLUGIN || 'ilp-plugin-xrp-escrow')
const ilpCredentials = JSON.parse(process.env.ILP_CREDENTIALS)
const plugin = new Plugin(ilpCredentials)
const paidAgent = IlpAgent(agent, plugin)

plugin.on('outgoing_prepare', (transfer) => {
  debug('prepared payment for', transfer.amount)
})

plugin.on('outgoing_fulfill', (transfer) => {
  debug('executed payment for', transfer.amount)
})

const die = (message) => {
  console.error(message)
  process.exit(1)
}

const argv = require('yargs')
  .option('data', {
    alias: 'd',
    describe: 'body data'
  })
  .option('json', {
    alias: 'j',
    describe: 'send data as json',
  })
  .option('header', {
    alias: 'H',
    describe: 'header with data',
    array: true,
    default: []
  })
  .option('form', {
    alias: 'F',
    describe: 'form data',
    array: true,
    default: []
  })
  .option('max-redirs', {
    describe: 'max number of redirects',
    number: true,
    default: 0
  })
  .option('request', {
    describe: 'http method to use',
    alias: 'X',
    default: 'POST'
  })
  .option('url', {
    describe: 'url to fetch'
  })
  .option('user', {
    alias: 'u',
    describe: '<user:password> for basic auth'
  })
  .option('max-amount', {
    alias: 'a',
    describe: `maximum amount (in ${plugin.getInfo().currencyCode})`,
    default: 1
  })
  .argv

// suppress things from ajv
console._log = console.log
console.log = () => {}

const splitOnFirst = (string, delim) => {
  const splitAt = string.indexOf(delim)
  const head = string.substring(0, splitAt)
  const tail = string.substring(splitAt + 1)
  return [ head, tail ]
}

const url = argv.url || argv._[0]
if (argv.form && argv.data) die('cannot specify --form (-F) and --data (-d)')
if (argv.url && argv._[0]) die('cannot specify --url and positional <url>')
if (!url) die('must specify a URL with positional <url> or --url')
if (argv.json) argv.header.push('Content-Type: application/json')
const request = agent(argv.request, url)
  .redirects(argv['max-redirs'])

if (argv.data) {
  request.send(data)
} else if (argv.form) {
  for (const field of argv.form) {
    if (argv.json) {
      const [ key, value ] = splitOnFirst(field, '=')
      request.send({ [key]: value })
    } else {
      request.send(field)
    }
  }
}

for (const header of argv.header) {
  const [ name, value ] = splitOnFirst(header, ':')
  request.set(name, value)
}

if (argv.user) {
  const [ user, pass ] = splitOnFirst(argv.user, ':')
  request.auth(user, pass)
}

async function run () {
  const amount = +argv['max-amount'] * Math.pow(10, plugin.getInfo().currencyScale)
  const result = await request
    .pay(amount)

  console._log(result.body)
  process.exit(0)
}

run().catch(e => die(e.message))
