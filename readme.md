# Email Assistant for macOS Mail

## Overview
This script is designed to enhance the functionality of the macOS Mail application by integrating with ChatGPT. It allows users to automatically generate responses to emails using the advanced capabilities of ChatGPT's AI.

## Features
- **Automated Email Responses**: Leverages ChatGPT to generate intelligent and contextually relevant email replies.
- **Customizable Prompts**: Users can add additional instructions to tailor the AI response.
- **Secure API Key Storage**: Uses macOS Keychain for secure storage of the OpenAI API key.
- **Ease of Use**: Integrated into the Mail app as a Quick Action or as a standalone Automator application.

## Setup
### Prerequisites
- macOS with Mail application
- OpenAI API key
- Automator application on macOS

### Installation
1. **Create Automator Script**:
    - Open Automator and create a new Quick Action or Application.
    - Add a `Run JavaScript` action and paste the provided script.

2. **API Key Configuration**:
    - During the first run, the script will prompt for the OpenAI API key.
    - The key is securely stored in the macOS Keychain for subsequent uses.

### Configuring in Mail
- For Quick Actions: The feature can be accessed via the top bar menu entry "Mail".

## Usage
1. **Select an Email**: In the Mail app, select the email you want to respond to.
2. **Run the Script**:
    - For Quick Actions: Click Mail in the top bar, navigate to `Services`, and select the created Quick Action.
3. **Add Instructions (Optional)**: Enter any additional instructions or context to help tailor the AI response.
4. **Generate and Use Response**: The script interacts with ChatGPT to generate a response, which is uses as mail body in a response email.

## Security and Privacy
- This script does not store email contents or additional inputs.
- All interactions with the ChatGPT API are securely handled, and the API key is stored securely in the macOS Keychain.