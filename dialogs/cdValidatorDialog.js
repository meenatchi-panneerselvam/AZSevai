// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const CD_PROMPT = 'cdPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class cdValidatorDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'cdValidatorDialog');
        this.addDialog(new TextPrompt(CD_PROMPT, this.cdPromptValidator.bind(this)))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.initialStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async initialStep(stepContext) {
        // const timex = stepContext.options.date;
        const changeDocument = stepContext.options.text

        const promptMessageText = 'Please provide the Change Document Number.';
        const promptMessage = MessageFactory.text(promptMessageText, promptMessageText, InputHints.ExpectingInput);

        const repromptMessageText = "I'm sorry, for best results, please provide only the 10 Digit Number.";
        const repromptMessage = MessageFactory.text(repromptMessageText, repromptMessageText, InputHints.ExpectingInput);

        if (!changeDocument) {
            // We were not given any date at all so prompt the user.
            return await stepContext.prompt(CD_PROMPT,
                {
                    prompt: promptMessage,
                    retryPrompt: repromptMessage
                });
        }
        // We have a Change Document and we just need to check it is valid.
        // const cdProperty = new cdProperty(changeDocument);
        if (!cdProperty.types.has('definite')) {
            // This is essentially a "reprompt" of the data we were given up front.
            return await stepContext.prompt(CD_PROMPT, { prompt: repromptMessage });
        }
        return await stepContext.next([{ changeDocument: changeDocument }]);
    }

    async finalStep(stepContext) {
        const changeDocument = stepContext.result[0].changeDocument;
        return await stepContext.endDialog(changeDocument);
    }

    async cdPromptValidator(promptContext) {
        if (promptContext.recognized.succeeded) {
            // This value will be a 10 digit number
            const changeDocument = promptContext.recognized.value; //.split('T')[0];
            return changeDocument;
            // return new cdProperty(changeDocument).types.has('definite');
        }
        return false;
    }
}

module.exports.cdValidatorDialog = cdValidatorDialog;
