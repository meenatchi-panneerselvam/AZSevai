# AZ Sevai  v0.05

This bot has been created using [Bot Framework](https://dev.botframework.com).

## Prerequisites
- [Node.js](https://nodejs.org) version 10.14 or higher
    ```bash
    # determine node version
    node --version
    ```
# Change to the repository

All merges to be repository are to be reviewed.

- Start by creating a fork from master/origin.
- Perform the code corrections.
- Commit the changes into new branch.
- Create a pull request to merge the change int the master repo.

Repo owner is allowed to do changes directly.

Before doing changes re-sync your repository. Read [how to Sync a Fork.](https://help.github.com/en/articles/syncing-a-fork)

# Running the bot locally
- Clone/Download the Repo.
    ```bash
    # clone the repo 
    git clone https://github.com/ireps/AZSevai.git
    ```
- Configure/Create .env file in the Local Folder.
Never commit the filled .env file as it contins Client ID and Secret passwords.
    ```bash
    # .env File 
    MicrosoftAppId=#<value here>
    MicrosoftAppPassword=#<value here>
    ScmType=None
    LuisAppId=#<value here>
    LuisAPIKey=#<value here>
    LuisAPIHostName=#<value here>
    QnAKnowledgebaseId=#<value here>
    QnAEndpointKey=#<value here>
    QnAEndpointHostName=#<value here>
    ```
- Open the [Node.js](https://nodejs.org) terminal and got to the repo local folder. Run index.js file.
    ```bash
    # Start the bot 
    node index.js
    ```
    
    If there are no syntax errors, this will start a local web server with port number to be used as BOT URL ( EndPoint URL ) in next step.

# Testing the bot using Bot Framework Emulator

[Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.5.2 or greater from [here](https://github.com/Microsoft/BotFramework-Emulator/releases)
## Connect to the bot using Bot Framework Emulator
- Launch Bot Framework Emulator
- File -> Open Bot
    - If there is no bot already configured, create new configuration, by providing Bot's EndPoint URL and App ID and Password. 
    - This step will create the .bot file which can be opened via the Emulator.

- Enter a Bot URL of `http://localhost:3978/api/messages`

# Deploy the bot to Azure
Commits to this Repo will be automatically synced into Azure.
Contiuous Integration is configured

