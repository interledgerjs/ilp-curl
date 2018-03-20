#!/usr/bin/env node
const fetch = require('ilp-fetch')
const debug = require('debug')('ilp-curl')
const fs = require('fs')
const plugin = require('ilp-plugin')()

const die = (message) => {
  console.error(message)
  process.exit(1)
}

const argv = require('yargs')
  .usage('ilp-curl <url> [options]')
  .option('data', {
    alias: 'd',
    describe: 'body data'
  })
  .option('data-raw', {
    describe: 'body data that does not load file with @'
  })
  .option('json', {
    alias: 'j',
    describe: 'send data as json'
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
    array: true
  })
  .option('max-redirs', {
    describe: 'max number of redirects',
    number: true,
    default: 0
  })
  .option('request', {
    describe: 'http method to use',
    alias: 'X',
    default: 'GET'
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
    describe: `maximum amount`,
    default: 100000
  })
  .argv

const splitOnFirst = (string, delim) => {
  const splitAt = string.indexOf(delim)
  const head = string.substring(0, splitAt)
  const tail = string.substring(splitAt + 1)
  return [ head, tail ]
}

const url = argv.url || argv._[0]
const rawData = argv['data-raw'] || argv.data
if (argv.form && rawData) die('cannot specify --form (-F) and --data (-d)')
if (argv.data && argv['data-raw']) die('cannot specify --data-raw and -data (-d)')
if (argv.url && argv._[0]) die('cannot specify --url and positional <url>')
if (!url) die('must specify a URL with positional <url> or --url')
const fetchOptions = {
  method: argv.request.toUpperCase(),
  redirect: 'follow',
  follow: argv['max-redirs'],
  headers: {
    'Content-Type': (argv.json ? 'application/json' : 'application/x-www-form-urlencoded')
  }
}

if (rawData) {
  // the '@' causes a file to be loaded
  if (argv.data && rawData.startsWith('@')) {
    debug('loading file', rawData.substring(1))
    const contents = fs.readFileSync(rawData.substring(1))
    fetchOptions.headers['Content-Type'] = (argv.json ? 'application/json' : 'application/octet-stream')
    fetchOptions.body = (argv.json ? contents.toString('utf8') : contents)
  } else {
    fetchOptions.body = rawData
  }
} else if (argv.form) {
  const keyValueBody = {}
  for (const field of argv.form) {
    const [ key, value ] = splitOnFirst(field, '=')
    if (value.startsWith('@')) {
      debug('loading file', rawData.substring(1))
      const valueContents = fs
        .readFileSync(value.substring(1))
        .toString('utf8')
      keyValueBody[key] = valueContents
    } else {
      keyValueBody[key] = value
    }
  }
  fetchOptions.body = JSON.stringify(keyValueBody)
}

for (const header of argv.header) {
  const [ name, value ] = splitOnFirst(header, ':')
  fetchOptions.headers[name] = value
}

if (argv.user) {
  fetchOptions.headers['Authorization'] = 'Basic ' +
    Buffer.from(argv.user).toString('base64')
}

async function run () {
  debug('running')
  await plugin.connect()

  debug('connected')
  fetchOptions.plugin = plugin
  fetchOptions.maxPrice = +argv['max-amount']

  const result = await fetch(url, fetchOptions)
  const text = await result.text()

  console.log(text)
  process.exit(0)
}

run().catch(e => die((e.res && e.res.text) || e.message))
