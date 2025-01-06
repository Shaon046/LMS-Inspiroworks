import { LightningElement, api, track } from 'lwc';
import getFields from '@salesforce/apex/LmsRecordCreatePopupController.getFields';
import saveRecord from '@salesforce/apex/LmsRecordCreatePopupController.saveRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class LmsRecordCreatePopup extends LightningElement {

    objectName = "Course__c";
    @api objectLabel;
    @track fieldAPINames = [];
    @track userInput = {};

    @track fields = {
        // 'Name': { label: 'Name', type: 'text' },
        // 'Active__c': { label: 'Active', type: 'picklist', options: ['Yes', 'No'] },
        // 'StartDate__c': { label: 'Start Date', type: 'date' },
        // 'DateTime__c': { label: 'Date and Time', type: 'datetime-local' },
        // 'File__c': { label: 'Upload File', type: 'file' },
    };

    fieldAPINames = Object.keys(this.fields);

    connectedCallback() {
        this.getFields();
    }

    getFields() {
    getFields({ objectName: this.objectName })
        .then((res) => {
            this.fields = res; 
            console.log('Fields from Apex: ', res);
        })
        .catch((err) => console.log('Error:', err));
}

  get fieldEntries() {
    const numberOfFieldInLeft = Math.ceil(Object.keys(this.fields).length / 2);
    console.log('Number of fields on the left:', numberOfFieldInLeft);

    return Object.entries(this.fields).map(([fieldName, fieldConfig], idx) => {
        const options = fieldConfig.options ? fieldConfig.options.map(option => ({
            label: option,
            value: option
        })) : [];

        return {
            apiName: fieldName,
            label: fieldConfig.label,
            type: fieldConfig.type,
            options: options,
            isLeftSide: idx < numberOfFieldInLeft,
            isCheckbox: fieldConfig.type === 'checkbox',
            isPicklist: fieldConfig.type === 'PICKLIST',
            isFile: fieldConfig.type === 'file',
            isText: ['STRING', 'password', 'email', 'tel', 'url'].includes(fieldConfig.type),
            isDate: fieldConfig.type === 'date',
            isDatetimeLocal: fieldConfig.type === 'datetime-local',
            isNumber: fieldConfig.type === 'DOUBLE',
            isSearch: fieldConfig.type === 'search'
        };
    });
}


    handleInputChange(event) {
        const fieldName = event.target.dataset.id;
        let fieldValue = event.target.value;
        //if checkbox
        if (event.target.type === 'checkbox') {
            fieldValue = event.target.checked;
        }

        if (fieldValue !== null && fieldValue !== '') {
            this.userInput[fieldName] = fieldValue;
        } else {
            delete this.userInput[fieldName];
        }

        console.log('Current user input:', this.userInput);
    }

    saveRecord() {
        saveRecord({ objectName: this.objectName, userInput: this.userInput })
            .then((res) => {
                console.log('Saved@@@', res);
                this.userInput = {};
                this.showToast('Success', 'Record has been successfully saved', 'success');
            })
            .catch((err) => {
                console.log("error is ", err);
                this.showToast('Error', 'An error occurred while saving the record', 'error');
            });
    }


    close() {
        this.dispatchEvent(new CustomEvent('closerecordcreatepopup'));
    }
    showToast(title, message, varient,) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: varient,
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }
}