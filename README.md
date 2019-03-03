# ILP Curl
> curl-like CLI for ILP paid requests

## Usage

Make sure you're connected to Moneyd. You can connect to the
[testnet](https://medium.com/interledger-blog/using-moneyd-to-join-the-ilp-testnet-ba64bd42bb14)
or the
[livenet](https://medium.com/interledger-blog/joining-the-live-ilp-network-eab123a73665).

```sh
# install the package globally to add binaries
$ npm install -g ilp-curl

# make a paid POST request with JSON parameters
$ ilp-curl -X POST ilp.example.com/sms --json -F to='+15551234567' -F text='hello'

# make a paid POST request with JSON parameters and a max amount of 1000 XRP drops
$ ilp-curl -X POST ilp.example.com/sms --json -F to='+15551234567' -F text='hello' --amount 1000

# make a paid GET request
$ ilp-curl ilp.example.com/images

# make a paid and authenticated request
$ ilp-curl ilp.example.com/images --user admin:password

# upload a file with unhash
$ ilp-curl localhost:3000/upload --data @image.png
# --> { digest: '3b4f5076101d7a3890056bdda09b1b7d37f24725ba11344fb46a7f2dffe74a55' }
```

## More Options

```
ilp-curl <url> [options]

Options:
  --help            Show help                                          [boolean]
  --version         Show version number                                [boolean]
  --data, -d        body data
  --data-raw        body data that does not load file with @
  --json, -j        send data as json
  --header, -H      header with data                       [array] [default: []]
  --form, -F        form data                              [array] [default: []]
  --max-redirs      max number of redirects                [number] [default: 0]
  --request, -X     http method to use                          [default: "GET"]
  --url             url to fetch
  --user, -u        <user:password> for basic auth
  --max-amount, -a  maximum amount                               [default: 1000]
```
