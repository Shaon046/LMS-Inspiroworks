import { LightningElement, api, track } from 'lwc';
import getFields from '@salesforce/apex/LmsRecordCreatePopupController.getFields';
import saveRecord from '@salesforce/apex/LmsRecordCreatePopupController.saveRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class LmsRecordCreatePopup extends LightningElement {

    @api objectName;
    @api objectLabel;
    @api customMetadataName;
    @api recordId;
    recordId = 'a00fJ000001yyVNQAY'
    // @api parentComponent;
    @api hasAttachment;
    @track fieldAPINames = [];
    @track userInput = {};
    @track defaultVal;
    @track attachment = [];
    @track fields = {};
    //  @track file;
    @track fileName;
    @track fileExtension;
    fieldAPINames = Object.keys(this.fields);
    @track requiredFields = [];

    allowedFileTypes = ['image/jpeg', 'image/png'];


    connectedCallback() {
        this.getFields();
    }

    getFields() {
        console.log('this.recordId@@@@@@@@@', this.recordId, 'this.hasAttachment', this.hasAttachment)
        getFields({ objectName: this.objectName, customMetadataName: this.customMetadataName, recordId: this.recordId, Attachment: this.hasAttachment })
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

            //  REFERENCE type 
            const isLookup = fieldConfig.type == 'REFERENCE';
            if (isLookup) {
                console.log('lookup@@@@@@@@@@@@47', fieldName)
                this.userInput[fieldName] = this.recordId;
                this.defaultVal = fieldConfig.defaultValue;
            }

            //test 
            if (fieldConfig.related) {
                this.attachment.push(fieldName);
            }

            if (fieldConfig.required) {
                // console.log('issue 1', fieldName)
                this.requiredFields.push(fieldName)
            }
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
                isNumber: fieldConfig.type == 'DOUBLE',
                isSearch: fieldConfig.type === 'search',
                isLookup: isLookup,
                isRequired: fieldConfig.required

            };
        });
    }



    handleInputChange(event) {
        const fieldName = event.target.dataset.id;
        let fieldValue = event.target.value;

        // Handle checkbox
        if (event.target.type === 'checkbox') {
            fieldValue = event.target.checked;
        }



        // Handle file input
        if (event.target.type === 'file') {
            const file = event.target.files[0];
            if (fieldName == 'Upload Image') {
                const { size, type } = file;
                if (!this.allowedFileTypes.includes(type)) {
                    this.showToast('Warning', 'Invalid file format. Please upload a JPEG or PNG image.', 'warning');
                    return;
                }
            }
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // const base64 = e.target.result; // Full base64 string
                    const base64Data = reader.result.split(',')[1]; // Remove MIME type prefix
                    this.fileName = file.name;
                    this.fileExtension = file.name.split('.').pop();

                    if (fieldName) {
                        this.userInput[fieldName] = base64Data; // Store raw Base64 data
                        // console.log('Processed Base64:', base64Data);
                        this.showToast('Success', 'File uploaded', 'success');
                    }
                };
                reader.readAsDataURL(file);
                return;
            }
        }

        // Handle other input types
        if (fieldValue !== null && fieldValue !== '' && event.target.type !== 'file') {
            this.userInput[fieldName] = fieldValue;
        } else if (!fieldValue) {
            delete this.userInput[fieldName];
        }
        console.log('Current user input:', this.userInput);
    }


    saveRecord() {
        console.log('Required Fields:', this.requiredFields);
        console.log('User Input:', this.userInput);

        //error message if all input bnlk
        if (Object.keys(this.userInput).length === 0) {
            this.showToast('Error', 'Please fill in the required fields.', 'error');
            return;
        }
        //error if any required fld blnk
        for (let key of this.requiredFields) {
            if (!this.userInput[key] || this.userInput[key] === '') {
                this.showToast('Error', `The required cannot be blank.`, 'error');
                return;
            }
        }


        let attachmentFound;
        for (let key in this.userInput) {
            if (this.attachment.includes(key)) {
                // this.file = this.userInput[key];
                attachmentFound = this.userInput[key]
                //console.log('Attachment found:', attachmentFound);
                delete this.userInput[key];
                break;
            }
        }

        saveRecord({ objectName: this.objectName, userInput: this.userInput, base64ImageData: attachmentFound, fileExtension: this.fileExtension })
            .then((res) => {
                this.showToast('Success', 'Record has been successfully saved', 'success');
                this.close();
                console.log(res)
                //catch the event if you want do anything after save
                this.dispatchEvent(new CustomEvent('recordsaved', { bubbles: true, composed: true }));
            })
            .catch((err) => {
                console.log("Error:", err);
                this.showToast('Error', 'An error occurred while saving the record', 'error');
            });
    }



    close() {
        this.dispatchEvent(new CustomEvent('closerecordcreatepopup'))
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

    //event catch function
    afterRecordSave() {
        console.log("record saved")
    }
}