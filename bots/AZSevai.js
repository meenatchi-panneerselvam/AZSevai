// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler } = require('botbuilder');
const { QnAMaker } = require('botbuilder-ai');

process.env.QnAKnowledgebaseId = "211d6069-9de1-4286-a647-628fcb586f2f"
process.env.QnAEndpointKey = "538602c9-e614-462e-9ece-042d33fdf1f5"
process.env.QnAEndpointHostName = "https://azsevaiqna1.azurewebsites.net/qnamaker"

class AZSevai extends ActivityHandler {
    constructor() {
        super();

        try {
            this.qnaMaker = new QnAMaker({
                knowledgeBaseId: process.env.QnAKnowledgebaseId,
                endpointKey: process.env.QnAEndpointKey,
                host: process.env.QnAEndpointHostName
            });
        } catch (err) {
            console.warn(`QnAMaker Exception: ${ err } Check your QnAMaker configuration in .env`);
        }

        // If a new user is added to the conversation, send them a greeting message
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Welcome to the QnA Maker sample! Ask me a question and I will try to answer it.');
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        // When a user sends a message, perform a call to the QnA Maker service to retrieve matching Question and Answer pairs.
        this.onMessage(async (context, next) => {
            if (!process.env.QnAKnowledgebaseId || !process.env.QnAEndpointKey || !process.env.QnAEndpointHostName) {
                let unconfiguredQnaMessage = 'NOTE: \r\n' + 
                    'QnA Maker is not configured. To enable all capabilities, add `QnAKnowledgebaseId`, `QnAEndpointKey` and `QnAEndpointHostName` to the .env file. \r\n' +
                    'You may visit www.qnamaker.ai to create a QnA Maker knowledge base.'

                 await context.sendActivity(unconfiguredQnaMessage)
            }
            else {
                console.log('Calling QnA Maker');
    
                const qnaResults = await this.qnaMaker.getAnswers(context);
    
                // If an answer was received from QnA Maker, send the answer back to the user.
                if (qnaResults[0]) {
                    await context.sendActivity(qnaResults[0].answer);
    
                // If no answers were returned from QnA Maker, reply with help.
                } else {
                    // await context.sendActivity('No QnA Maker answers were found.');
                    console.log('No QnA Maker answers were found.');

                    // -> Get Intent from LUIS
                    

                    // -> If post needed, prompt for User credentials.
                    // --> Convert Credentials into a BASIC Authorization Key
                    // --> Prepare the code 
                    // ----> Sample Code 
                            // GET /sap/opu/odata/sap/ProcessManagement/BranchSet?$format=json HTTP/1.1
                            // Host: shs-ci-sbx.sap.astrazeneca.net:8010
                            // Authorization: Basic S1BSRzU1NjpIYXJpQDExMlBlcmk=
                            // Cache-Control: no-cache
                            // Postman-Token: c7cd6371-afff-f688-c1ca-9c24a7d70d38

                    // -> Trigger Get or Post Request to Solman via Mulesoft 
                    



                }
    
            }
            
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.AZSevai = AZSevai;
