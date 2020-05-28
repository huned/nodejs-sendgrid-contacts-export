# SendGrid Contacts Export for Node.js

Main repo: [https://github.com/huned/nodejs-sendgrid-contacts-export](https://github.com/huned/nodejs-sendgrid-contacts-export)

The simplest way to get all your SendGrid contacts as JSON.

## Usage

Use it like this:

    const SendGrid = require(./lib/sendgrid)
    const sg = new SendGrid('MY API KEY')
    const contacts = await sg.getContacts()
    console.log(contacts)

Optionally, specify options using SendGrid's Contacts Export API options. E.g.,

    // See SendGrid's Marketing > Contacts > Exports API doc for details.
    // https://sendgrid.com/docs/API_Reference/api_v3.html
    const opts = {
      "list_ids": [ "string" ],
      "segment_ids": [ "string" ],
      "notifications": {
        "email": "boolean (optional)"
      },
      "file_type": "csv",
      "max_file_size": 5000
    }
    await sg.getContacts(opts)

## Command Line Usage

Clone this repo, then:

    SENDGRID_API_KEY=<your api key> npm start

And it will print all your contacts as JSON to `stdout`.

You can also set `SENDGRID_LIST_IDS` and `SENDGRID_SEGMENT_IDS` to comma
separated list/segment ids. E.g.,

    SENDGRID_API_KEY=<your api key> SENDGRID_LIST_IDS=<list1 id>,<list2 id> npm start

You can also define each of these environment in a `./.env` file instead of at the
command line, if you wish.

## Known Issues

* No tests yet (maybe you can submit a PR?!)

## Author

[Huned Botee](https://github.com/huned)

## License

MIT
