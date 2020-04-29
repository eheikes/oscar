# OSCAR Task Agent

This project contains the task agent for the OSCAR assistant.

## Requirements

* [Node.js+npm](https://nodejs.org) 10+
* A [Trello](https://trello.com) account.
* A Trello API key and token. You can get your key and token from [trello.com/app-key](https://trello.com/app-key).
* An email server or email account with SMTP.
* The [Card Size power-up](https://screenful.com/card-size-for-trello/) should be installed on your Trello board(s).

## Configuration

1. Rename the `config.yml.example` file to `config.yml` and fill it out.
    * `trello` -> `lists` should contain the IDs of the Trello lists to include. [Read about how to get the ID of a list.](https://customer.io/actions/trello/)
1. Rename the `.env.example` file to`.env` and fill it out.
1. The templates for the email are in the `templates` folder. You can change them as desired, using the [Handlebars language](https://handlebarsjs.com/guide/).

## Usage

### Creating To-Dos

1. Create a Trello card for your to-do.
1. Add a label named `Important` or `Not Important`.
1. Add a due date.
1. Add a time estimate using the Card Size power-up (optional).

### Emailing a Task List

1. Run `yarn install`
1. Run `yarn start email` every time you want to build and email a task list.

### Creating the Recurring Todos

1. Run `yarn install`
1. Run `yarn start create` to create Trello cards of the recurring tasks for the current day.
