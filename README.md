# jest-reporter-log-validator   

## The problem
Warnings tend to accumulate with time, which can end up producing bugs in production and a bad dev experience. This project aims to create validations for console messages based on string patterns. This will prevent more warnings from being added and also allows for some of them to be allowed.

## Requirements
In order for this plugin to work, you must run jest with the cli flag verbose as `false`. This is because verbose mode doesn't provide the console messages to the reporters.

## Setup

### Installation
`npm install -D jest-reporter-log-validator` or `yarn add -D jest-reporter-log-validator`

### Configuration
Usually, you'll only want to run this reporter when running against all your tests. To do so, you just need to add this reporter to your configuration

If you're using create-react-app, you can still pass the reporters to be used but as a cli argument like this:

Inside your package.json you can have a test script like this:
```json
{
    ...
    "test:all": "react-scripts test --reporters=default --reporters=jest-reporter-log-validator --verbose=false --watchAll=false"
}
```

### Create file with validations
Create in your root folder a file called `.jest-logs-restrictions.json`. It will contain the validations to apply for the log messages. The structure of such file is as follows:

```json
{
  "logsWithLimit": [
    {
      "patterns": [
        "Each child in a list should have a unique"
      ],
      "max": 4
    }
  ]
}
```

Some further explanation
- `logsWithLimit`: This is where you can set how many times a certain warning can appear before the reporter fails. Every value of the `patterns` attribute will be used to match the current console message. This is useful when a certain message has dynamic parts to it like a class name.

## Configuration

|Environment variable name | Description | Default |
| `FAIL_IF_LOG_RESTRICTIONS_OUTDATED | If no max bounds are exceeded and one or more log messages appear less than their related max, this flag makes the reporter fail. This is useful in the case where you want to address warnings and try to keep them close to zero.|
