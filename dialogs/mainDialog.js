// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { MessageFactory, InputHints, CardFactory } = require('botbuilder');
// const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const axios = require('axios');

const WelcomeCard = require('../resources/welcomeCard.json');
const OCTACard = require('../resources/octaCard.json');
const ReviewCard = require('../resources/reviewCard.json');
const StatusCard = require('../resources/statusCard.json');
const LinkCard = require('../resources/linkCard.json');

// const CONFIRM_PROMPT = 'confirmPrompt';
// const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'TextPrompt';
const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class changeDocument {
	constructor(request, intent, changeDocument, region, result, currentStatus, status1, status2, status3, status4, url) {
		this.request = request;
		this.intent = intent;
		this.changeDocument = changeDocument;
		this.region = region;
		this.result = result;
		this.currentStatus = currentStatus;
		this.status1 = status1;
		this.status2 = status2;
		this.status3 = status3;
		this.status4 = status4;
		this.url = url;

	}
}

class MainDialog extends ComponentDialog {
	constructor(luisRecognizer, controlDialog) {
		super('MainDialog');

		if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
		this.luisRecognizer = luisRecognizer;

		if (!controlDialog) throw new Error('[MainDialog]: Missing parameter \'controlDialog\' is required');

		// Define the main dialog and its related components.
		this.addDialog(new TextPrompt(TEXT_PROMPT))
			.addDialog(controlDialog)
			.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
				this.introStep.bind(this),
				this.luisStep.bind(this),
				this.muleStep.bind(this),
				this.finalStep.bind(this)
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
     * Collects the CD Number and relevant Info
     */
	async introStep(stepContext) {

		stepContext.values.changeDocument = new changeDocument();

		let handler = {
			get: function (target, name) {
				return name in target ?
					target[name] :
					'Key does not exist';
			}
		}

		let p = new Proxy(stepContext.context, handler);

		if (p._activity.text) {
			switch (p._activity.text) {
				case "hi":
					// Restarting the Bot with welcome card re-trigger
					break;
				default:
					// Give a message and exit
					const restartMessageText = 'Why not just say "hi" ?';
					await stepContext.context.sendActivity(restartMessageText, restartMessageText, InputHints.IgnoringInput);
					return false;
			}
			const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);
			await stepContext.context.sendActivity({ attachments: [welcomeCard] });
		}

		const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'Try selecting from the options above.';
		const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
		return await stepContext.prompt('TextPrompt', { prompt: promptMessage });

	}

	/**
	* Second step in the waterfall.  This will use LUIS to attempt to extract the Intent and other info.
	* Then, it hands off to the bookingDialog child dialog to collect any remaining details.
	*/
	async luisStep(stepContext) {

		const changeDocuments = {};

		if (stepContext.result) {

			//TODO: Ensure that Change Documents array carrying number and itent is flown in here.
			stepContext.values.changeDocument.request = stepContext.result;
			changeDocuments.request = stepContext.result;
			switch (stepContext.result) {
				case "CD Ready for OCTA":
					changeDocuments.intent = "octa";
					break;
				case "CD":
					changeDocuments.intent = "link";
					break;					
				case "CD Status":
					changeDocuments.intent = "status";
					break;
				case "CD Ready for ABAP Review":
					changeDocuments.intent = "review";
					break;
				case "CD Ready for Tech Arch Approval":
					changeDocuments.intent = "archreview";
					break;					
				default:
					break;
			}


			// if (!this.luisRecognizer.isConfigured) {
			//     const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
			//     await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
			//     return await stepContext.next();
			// }

			if (!this.luisRecognizer.isConfigured) {
				// LUIS is not configured, we just run the controlDialog path.
				return await stepContext.beginDialog('controlDialog', changeDocuments);
			}

			//TODO: Prepare what LUIS should determine from our request

			// intent should be  "OCTA" or "review" or "status" or "link"


			// // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
			// const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
			// switch (LuisRecognizer.topIntent(luisResult)) {
			// case 'BookFlight': //TODO: Change this one
			//     // Extract the values for the composite entities from the LUIS result.
			//     const fromEntities = this.luisRecognizer.getFromEntities(luisResult);
			//     const toEntities = this.luisRecognizer.getToEntities(luisResult);

			//     // Show a warning for Origin and Destination if we can't resolve them.
			//     await this.showWarningForUnsupportedCities(stepContext.context, fromEntities, toEntities);

			//     // Initialize changeDocuments with any entities we may have found in the response.
			//     changeDocuments.destination = toEntities.airport;
			//     changeDocuments.origin = fromEntities.airport;
			//     changeDocuments.travelDate = this.luisRecognizer.getTravelDate(luisResult);
			//     console.log('LUIS extracted these booking details:', JSON.stringify(changeDocuments));

			//     // Run the BookingDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
			//     return await stepContext.beginDialog('controlDialog', changeDocuments);

			// case 'GetWeather': //TODO: Change this one
			//     // We haven't implemented the GetWeatherDialog so we just display a TODO message.
			//     const getWeatherMessageText = 'TODO: get weather flow here';
			//     await stepContext.context.sendActivity(getWeatherMessageText, getWeatherMessageText, InputHints.IgnoringInput);
			//     break;

			// default:
			//     // Catch all for unhandled intents
			//     const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })`;
			//     await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
			// }

		}

		return await stepContext.next();
	}

	/**
	* Third step in the waterfall.  This will use mulesoft to attempt to extract details from Solman
	*/
	async muleStep(stepContext) {

		if (stepContext.result) {

			stepContext.values.changeDocument.number = stepContext.result.number;
			stepContext.values.changeDocument.intent = stepContext.result.intent;
			
			// >>>>> Dummy Data  ( //TODO: Replace with mulesoft response)
			stepContext.values.changeDocument.region = "Europe SAP";
			stepContext.values.changeDocument.currentStatus = "READY";
			stepContext.values.changeDocument.result = "READY";
			stepContext.values.changeDocument.status1 = "Complete";
			stepContext.values.changeDocument.status2 = "Complete";
			stepContext.values.changeDocument.status3 = "Complete";
			stepContext.values.changeDocument.status4 = "Complete";
			stepContext.values.changeDocument.url = "DummyURL";
			// <<<<< Dummy Data 

			//TODO: Test the connectivity to Mulesoft
			// const url = "http://azsevai-demo-oytf.us-e2.cloudhub.io/octa"
			// const response = await axios({
			// 	url,
			// 	method: 'GET'
			// })

			// fetch('http://localhost/api/changeDocuments(objectId='{objectId}',intent='{intent}')')
			// .then((response) => {
			// 	return response.text(); // or .json() or .blob() ...
			// })
			// .then((text) => {
			// 	// text is the response body
			// })
			// .catch((e) => {
			// 	// error in e.message
			// });
			// console.log(response.data);

			// await stepContext.context.sendActivity(response.data, response.data, InputHints.IgnoringInput);
			return await stepContext.next();

		}
		return await stepContext.next();
	}

	/**
	* Final step in the waterfall.  This will use display the requsted information back to the user
	*/
	async finalStep(stepContext) {
		if (stepContext.values.changeDocument.intent) {
			switch (stepContext.values.changeDocument.intent) {
				case "OCTA":
					var octaCard = CardFactory.adaptiveCard(OCTACard);

					// For Updating System and Change Document Number
					octaCard.content.body[0].columns[0].items[0].text = stepContext.values.changeDocument.region;
					octaCard.content.body[0].columns[1].items[0].text = stepContext.values.changeDocument.number;

					// For Readiness for OCTA Status (READY or NOT READY)
					octaCard.content.body[0].columns[1].items[1].text = stepContext.values.changeDocument.result;
					octaCard.content.body[0].columns[1].items[1].color = (stepContext.values.changeDocument.result = "READY") ? "Good" : "Attention";

					octaCard.content.body[1].columns[1].items[1].text = stepContext.values.changeDocument.status1; // For Code Review Status
					octaCard.content.body[1].columns[1].items[2].text = stepContext.values.changeDocument.status2; // For Transports Released
					octaCard.content.body[1].columns[1].items[3].text = stepContext.values.changeDocument.status3; // For Documents Approval

					octaCard.content.body[1].columns[1].items.map(function (x) { if (x.text == "Complete") { x.color = "Good"; } else { x.color = "Attention"; } return x; })

					// For Updating CD URL
					octaCard.content.actions[0].url = stepContext.values.changeDocument.url;
					await stepContext.context.sendActivity({ attachments: [octaCard] });
					return await stepContext.next();

				case "review":
					var reviewCard = CardFactory.adaptiveCard(ReviewCard);

					// For Updating System and Change Document Number
					reviewCard.content.body[0].columns[0].items[0].text = stepContext.values.changeDocument.region;
					reviewCard.content.body[0].columns[1].items[0].text = stepContext.values.changeDocument.number;

					// For Readiness for review Status (READY or NOT READY)
					reviewCard.content.body[0].columns[1].items[2].text = stepContext.values.changeDocument.result;
					reviewCard.content.body[0].columns[1].items[2].color = (text = "READY") ? "Good" : "Attention";

					reviewCard.content.body[1].columns[1].items[1].text = stepContext.values.changeDocument.status1; // For CD In Review Status
					reviewCard.content.body[1].columns[1].items[2].text = stepContext.values.changeDocument.status2; // For ABAP Notes
					reviewCard.content.body[1].columns[1].items[3].text = stepContext.values.changeDocument.status3; // For Proposal for Solution
					reviewCard.content.body[1].columns[1].items[3].text = stepContext.values.changeDocument.status4; // For Functional SignOff					

					reviewCard.content.body[1].columns[1].items.map(function (x) { if (x.text == "Complete") { x.color = "Good"; } else { x.color = "Attention"; } return x; })

					// For Updating CD URL
					reviewCard.content.actions[0].url = stepContext.values.changeDocument.url;
					await stepContext.context.sendActivity({ attachments: [reviewCard] });
					return await stepContext.next();

				case "status":
					var statusCard = CardFactory.adaptiveCard(StatusCard);

					// For Updating System and Change Document Number
					octaCard.content.body[0].columns[0].items[0].text = stepContext.values.changeDocument.region;
					octaCard.content.body[0].columns[1].items[0].text = stepContext.values.changeDocument.number;

					// For Current CD Status (Color Control Not Required)
					octaCard.content.body[0].columns[1].items[2].text = stepContext.values.changeDocument.currentStatus;

					// For Updating CD URL
					statusCard.content.actions[0].url = stepContext.values.changeDocument.url;
					await stepContext.context.sendActivity({ attachments: [statusCard] });
					return await stepContext.next();

				case "link":
					var linkCard = CardFactory.adaptiveCard(LinkCard);
					linkCard.content.actions[0].text = "Open CD " & stepContext.values.changeDocument.number;
					linkCard.content.actions[0].url = stepContext.values.changeDocument.url;  // For Updating CD URL
					await stepContext.context.sendActivity({ attachments: [linkCard] });
					return await stepContext.next();
			}
		}
		return await stepContext.next();
	}
}

module.exports.MainDialog = MainDialog;
