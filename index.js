const app = Application.currentApplication();
app.includeStandardAdditions = true;
const apiKey = getOrSetApiKey();

//custom log function since console.log is not working in the automator environment
console.log = function (logMessage) {
    var app = Application.currentApplication();
    app.includeStandardAdditions = true;
    app.doShellScript("echo '" + logMessage + "' >> ~/logfile.txt");
};

function run(input, parameters) {
    Application("Mail").includeStandardAdditions = true;
    const Mail = Application("Mail");
    const selectedMessages = Mail.selection();
    if (selectedMessages.length === 0) {
        Mail.displayDialog("Erst eine Email auswählen, auf die geantwortet werden soll", {buttons: ["OK"]});
        return;
    }

    const selectedMail = selectedMessages[0];
    var mailContent = selectedMail.content();
    var mailSubject = selectedMail.subject();

    var userInput = "";
    while (userInput.trim() === "") {
        try {
            var response = Mail.displayDialog(mailSubject + "\nPlease enter how this mail should be answered:", {
                defaultAnswer: "",
                buttons: ["Cancel", "OK"],
                defaultButton: "OK",
            });
            if (response.buttonReturned === "Cancel") {
                break;
                return; // Exit the loop and function if "Cancel" was pressed
            }
        } catch (error) {
            dialogTimeOut = true;
            break;
        }
        userInput = response.textReturned;
    }

    var additionalInstructions = "Instructions: " + userInput;

    // Prepare the data for the ChatGPT API
    var requestData = {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: "You will be provided with an email message and instructions. Your task is to answer this email according to the instructions. Use the language of the given email."
            },
            {
                role: "user",
                content: ": Subject: " + mailSubject + "\n" + "Body: " + mailContent + "\n" + additionalInstructions
            }
        ]
    };
    var requestDataString = JSON.stringify(JSON.stringify(requestData));

    // Prepare and execute the curl command
    var curlCommand = 'curl https://api.openai.com/v1/chat/completions' +
        ' -H "Content-Type: application/json"' +
        ' -H "Authorization: Bearer ' + apiKey + '"' +
        ' -d ' + requestDataString;

    app.includeStandardAdditions = true; // This line is essential to enable shell scripting
    var result = app.doShellScript(curlCommand);

    //creating the response mail
    return createReplyWithEmailContent(selectedMail, processChatGptResponse(result));

}

function processChatGptResponse(responseString) {
    const Mail = Application("Mail");
    try {
        // Parse the response string into a JSON object
        var responseJson = JSON.parse(responseString);

        if (responseJson.error !== undefined) {
            Mail.displayDialog(responseJson.error.message, {buttons: ["OK"]});
            return false;
        }
        // Extract the content of the assistant's message
        return responseJson.choices[0].message.content;
    } catch (error) {
        // Handle any parsing errors
        return "Error processing response: " + error;
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
    var accountName = app.doShellScript('whoami');
    var keychainScript = 'security find-generic-password -a "' + accountName + '" -s "OpenAI API Key" -w';
    var apiKey;
    try {
        // Try to retrieve the API key from Keychain
        apiKey = app.doShellScript(keychainScript);
    } catch (error) {
        // If not found, prompt the user to enter the API key
        apiKey = app.displayDialog('OpenAI API-Key eingeben für ' + accountName + ':', {
            defaultAnswer: ''
        }).textReturned;

        // Store the API key in Keychain for future use
        var addKeychainScript = 'security add-generic-password -a"' + accountName + '" -s "OpenAI API Key" -w ' + apiKey;
        app.doShellScript(addKeychainScript);
    }
    return apiKey;
}


