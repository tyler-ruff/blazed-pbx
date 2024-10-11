# blazed-pbx
Private branch exchange (business phone system) for Blazed Labs. Published to Twilio Functions.

## Features
* Calling/Voice
  * IVR Menus / Automated Agent
  * Call Forwarding
  * Voicemail (w/ Email Notifications)
  * Conferencing (w/ Email Notifications)
  * SIP
  * Find Me/Follow Me
  * Extension Routing
* SMS
  * Append SMS Messages to Google Sheets document
  * Generate MFA Code and Send It
  * Commands (Such as "STOP" and "HELP")

## Running Locally

The SMS gateway and voice gateway are two seperate projects, each has to be built and run individually.

1. First, install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart#install-twilio-cli)
2. Install the [serverless toolkit](https://www.twilio.com/docs/labs/serverless-toolkit/getting-started)
```shell
twilio plugins:install @twilio-labs/plugin-serverless
```
3. Next install pre-recs
```shell
npm install
```
4. Copy .env.example to .env at the root of the project, then create a service account on Google IAM (ensure it has "editor" roles), and download/copy the credentials file (key) to: 
```/assets/service-account.private.json```   
5. Run a development server
```shell
npm run dev
```
1. Deploy functions
```shell
npm run deploy
```
