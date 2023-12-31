const app = Application.currentApplication();
app.includeStandardAdditions = true;
const apiKey = getOrSetApiKey();
Application("Mail").includeStandardAdditions = true;
const Mail = Application("Mail");

//custom log function since console.log is not working in the automator environment
console.log = function (logMessage) {
    var app = Application.currentApplication();
    app.includeStandardAdditions = true;
    app.doShellScript("echo '" + logMessage + "' >> ~/logfile.txt");
};


function run(input, parameters) {
    const selectedMessages = Mail.selection();
    if (selectedMessages.length === 0) {
        Mail.displayDialog("Erst eine Email auswählen, auf die geantwortet werden soll", {buttons: ["OK"]});
        return;
    } else {
        const selectedMail = selectedMessages[0];
        let mailContent = selectedMail.content();
        let mailSubject = selectedMail.subject();


        let dialogResult = Mail.displayDialog(
            "Subject: " + mailSubject + "\n\nGib die Art und Weise ein, wie die Email beantwortet werden soll:",
            {
                defaultAnswer: '',
            }
        );
        if(dialogResult.buttonReturned ==="Cancel"){
            return;
        }
        let additionalInstructions = dialogResult.textReturned;

        // Prepare the data for the ChatGPT API
        var requestData = {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: additionalInstructions
                },
                {
                    role: "user",
                    content: "Subject: " + mailSubject + "\n" + "Body: " + mailContent + "\n" + additionalInstructions
                }
            ]
        };
        let requestDataString = JSON.stringify(JSON.stringify(requestData));

        // Prepare and execute the curl command
        let curlCommand = 'curl https://api.openai.com/v1/chat/completions' +
            ' -H "Content-Type: application/json"' +
            ' -H "Authorization: Bearer ' + apiKey + '"' +
            ' -d ' + requestDataString;

        let chatGptResponse;
        try {
            app.includeStandardAdditions = true; // This line is essential to enable shell scripting
            let result = app.doShellScript(curlCommand);

            //creating the response mail
            let processResult = processChatGptResponse(result);
            if (processResult) {
                createReplyWithEmailContent(selectedMail, processResult);
            }

        } catch (error) {
            Mail.displayDialog("Error: " + error, {buttons: ["OK"]});
            return;
        }

    }
}

function processChatGptResponse(responseString) {
    try {
        // Parse the response string into a JSON object
        let responseJson = JSON.parse(responseString);
        if (responseJson.error) {
            Mail.displayDialog(responseJson.error.message, {buttons: ["OK"]});
            return false;
        }
        // Extract the content of the assistant's message
        // Return the extracted message or perform additional processing as needed
        return responseJson.choices[0].message.content;
    } catch (error) {
        // Handle any parsing errors
        return "Error processing ChatGPT response: " + error;
    }
}

function createReplyWithEmailContent(originalEmail, replyContent) {
    const Mail = Application("Mail");
    const replyEmail = Mail.OutgoingMessage().make();
    replyEmail.subject = "Re: " + originalEmail.subject();
    replyEmail.content = replyContent;
    replyEmail.visible = true;

    const recipients = originalEmail.sender(); // Assuming you want to reply to the sender
    replyEmail.toRecipients.push(Mail.Recipient({address: recipients}));

    // Set the original email as the reply-to email
    replyEmail.messageId = originalEmail.messageId();
    replyEmail.inReplyTo = originalEmail.messageId();

    // Open the email in Mail for editing/sending
    Mail.activate();
    replyEmail.open();
}

//retrieving the API key for ChatGPT by the user
function getOrSetApiKey() {
    let accountName = app.doShellScript('whoami');
    let keychainScript = 'security find-generic-password -a "' + accountName + '" -s "OpenAI API Key" -w';
    let apiKey;
    try {
        // Try to retrieve the API key from Keychain
        apiKey = app.doShellScript(keychainScript);
    } catch (error) {
        // If not found, prompt the user to enter the API key
        apiKey = app.displayDialog('OpenAI API-Key eingeben für ' + accountName + ':', {
            defaultAnswer: ''
        }).textReturned;

        // Store the API key in Keychain for future use
        let addKeychainScript = 'security add-generic-password -a"' + accountName + '" -s "OpenAI API Key" -w ' + apiKey;
        app.doShellScript(addKeychainScript);
    }
    return apiKey;
}


