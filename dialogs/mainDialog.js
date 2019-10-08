// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { MessageFactory, InputHints, CardFactory } = require('botbuilder');
// const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

const WelcomeCard = require('../resources/welcomeCard.json');

// const CONFIRM_PROMPT = 'confirmPrompt';
// const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'TextPrompt';
const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, controlDialog){ 
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!controlDialog) throw new Error('[MainDialog]: Missing parameter \'controlDialog\' is required');

        // Define the main dialog and its related components.
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(controlDialog)
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                       this.introStep.bind(this),
                    //    this.supportStep.bind(this),
                       this.actStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async introStep(stepContext) {
        // if (!this.luisRecognizer.isConfigured) {
        //     const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
        //     await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
        //     return await stepContext.next();
        // }

        // // const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
        // // return await stepContext.sendActivity({ attachments: [welcomeCard] });    

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'Try selecting from the options above.';
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    
        // we may not need an intro step as we wait for user input
        // return await stepContext.next();
    }

     /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const changeDocuments = {};

        if (!this.luisRecognizer.isConfigured) {
            // LUIS is not configured, we just run the BookingDialog path.
            return await stepContext.beginDialog('controlDialog', changeDocuments);
        }

        // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'BookFlight':
            // Extract the values for the composite entities from the LUIS result.
            const fromEntities = this.luisRecognizer.getFromEntities(luisResult);
            const toEntities = this.luisRecognizer.getToEntities(luisResult);

            // Show a warning for Origin and Destination if we can't resolve them.
            await this.showWarningForUnsupportedCities(stepContext.context, fromEntities, toEntities);

            // Initialize changeDocuments with any entities we may have found in the response.
            changeDocuments.destination = toEntities.airport;
            changeDocuments.origin = fromEntities.airport;
            changeDocuments.travelDate = this.luisRecognizer.getTravelDate(luisResult);
            console.log('LUIS extracted these booking details:', JSON.stringify(changeDocuments));

            // Run the BookingDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('controlDialog', changeDocuments);

        case 'GetWeather':
            // We haven't implemented the GetWeatherDialog so we just display a TODO message.
            const getWeatherMessageText = 'TODO: get weather flow here';
            await stepContext.context.sendActivity(getWeatherMessageText, getWeatherMessageText, InputHints.IgnoringInput);
            break;

        default:
            // Catch all for unhandled intents
            const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })`;
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }

        return await stepContext.next();
    }

    /**
     * Shows a warning if the requested From or To cities are recognized as entities but they are not in the Airport entity list.
     * In some cases LUIS will recognize the From and To composite entities as a valid cities but the From and To Airport values
     * will be empty if those entity values can't be mapped to a canonical item in the Airport.
     */
    async showWarningForUnsupportedCities(context, fromEntities, toEntities) {
        // const unsupportedCities = [];
        // if (fromEntities.from && !fromEntities.airport) {
        //     unsupportedCities.push(fromEntities.from);
        // }

        // if (toEntities.to && !toEntities.airport) {
        //     unsupportedCities.push(toEntities.to);
        // }

        // if (unsupportedCities.length) {
        //     const messageText = `Sorry but the following airports are not supported: ${ unsupportedCities.join(', ') }`;
        //     await context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
        // }
    }
}

module.exports.MainDialog = MainDialog;
