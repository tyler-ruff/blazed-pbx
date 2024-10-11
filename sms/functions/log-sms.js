const { google } = require('googleapis');
const fs = require('fs').promises;

const isAuthValid = (authJson) =>
  authJson.client_email &&
  authJson.client_email !== '<YOUR SERVICE ACCOUNT EMAIL ADDRESS>' &&
  authJson.private_key &&
  authJson.private_key !== '<YOUR PRIVATE KEY BLOCK HERE>';
const isResponseConfigValid = (responseJson) =>
  responseJson.sms_success &&
  responseJson.sms_success !== '<MESSAGE RESPONSE FOR SUCCESSFUL SMS>';
const isErrorConfigValid = (errorJson) =>
  errorJson.sheets_404 &&
  errorJson.sheets_404 !== '<RESPONSE FOR 404 DOCUMENT NOT FOUND>' &&
  errorJson.sheet_404 &&
  errorJson.sheet_404 !== '<RESPONSE FOR SHEET NOT FOUND WITHIN DOCUMENT>' &&
  errorJson.sheets_integration &&
  errorJson.sheets_integration !== '<RESPONSE FOR SHEETS INTEGRATION ERROR' &&
  errorJson.unknown_error &&
  errorJson.unknown_error !== '<RESPONSE FOR UNKNOWN ERROR>';

exports.handler = async function (context, event, callback) {

  // Get date & time for logging (ex: getDateTime(); returns: String)
  function getDateTime(){
    let date_time = new Date();
    let date = ("0" + date_time.getDate()).slice(-2);
    let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
    let year = date_time.getFullYear();
    let hours = ("0" + (date_time.getHours())).slice(-2);
    let minutes = ("0" + (date_time.getMinutes())).slice(-2);
    let seconds = ("0" + (date_time.getSeconds())).slice(-2);
    let offset = -date_time.getTimezoneOffset();
    let gmtOffset = "GMT" + (offset>=0?"+":"")+parseInt(offset/60)+":"+String(offset%60).padStart(2, "0");

    let receivedTimeStamp = `${month}/${date}/${year} ${hours}:${minutes}:${seconds} ${gmtOffset}`;
    return receivedTimeStamp;
  }

  const twiml = new Twilio.twiml.MessagingResponse();
  
  try {
    
    // Load config files
    const responseJson = JSON.parse(await fs.readFile(Runtime.getAssets()[context.RESPONSE_CONFIG].path));
    const authJson = JSON.parse(await fs.readFile(Runtime.getAssets()[context.GOOGLE_CREDENTIALS].path));
    const errorJson = JSON.parse(await fs.readFile(Runtime.getAssets()[context.ERROR_CONFIG].path));

    // Validate config files
    if(!isAuthValid(authJson)) { throw new Error('Invalid authentication JSON file'); }
    if(!isResponseConfigValid(responseJson)){ throw new Error('Invalid response script configuration'); }
    if(!isErrorConfigValid(errorJson)){ throw new Error('Invalid error message configuration'); }

    // Authenticate Google API
    const auth = new google.auth.JWT({
      email: authJson.client_email,
      key: authJson.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Connect to Google Sheets
    const sheets = google.sheets({
      version: 'v4',
      auth,
    });

    const dateTime = getDateTime();

    // Append data to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: context.DOCUMENT_ID,
      range: `'${context.SHEET_NAME}'`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[event.SmsSid, event.From, dateTime, event.Body]],
      },
    });

    // Send Response Message to Sender
    twiml.message(responseJson.sms_success);
  } catch (error) {
    if (error.code === 404) {
      console.error(errorJson.sheets_404);
    } else if (
      error.code === 400 &&
      error.errors &&
      error.errors[0] &&
      error.errors[0].message
    ) {
      console.error(`${errorJson.sheet_404} ${error.errors[0].message}.`);
    } else {
      console.error(`${errorJson.sheets_integration} ${error.message || error}`);
    }
    console.error(errorJson.unknown_error);
  }
  callback(null, twiml);
};