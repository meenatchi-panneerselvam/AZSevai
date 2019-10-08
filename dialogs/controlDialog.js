// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { cdValidatorDialog } = require('./cdValidatorDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const CD_VALIDATOR_DIALOG = 'cdValidatorDialog';
const WATERFALL_DIALOG = 'waterfallDialog';

class ControlDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'controlDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new cdValidatorDialog(CD_VALIDATOR_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.changeDocumentStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a change Document has not been provided, prompt for one.
     * This will use the change document Validator.
     */
    async changeDocumentStep(stepContext) {
        const changeDocument = stepContext.options;

        changeDocument.intent = stepContext.parent.result;

        if (!changeDocument.number) {
            return await stepContext.beginDialog(CD_VALIDATOR_DIALOG, { changeDocument: changeDocument.number });
        }
        return await stepContext.next(changeDocument.number);
    }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const changeDocument = stepContext.options;

        // Capture the results of the previous step
        changeDocument.number = stepContext.result;
        const messageText = `Please confirm, you would like to know: " ${ changeDocument.intent } " of Change Document with Number : " ${ changeDocument.number } ". Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const changeDocument = stepContext.options;
            return await stepContext.endDialog(changeDocument);
        }
        return await stepContext.endDialog();
    }

    // isAmbiguous(timex) {
    //     const timexPropery = new TimexProperty(timex);
    //     return !timexPropery.types.has('definite');
    // }
}

module.exports.ControlDialog = ControlDialog;
