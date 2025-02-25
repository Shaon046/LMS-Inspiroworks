import { LightningElement, api, track } from 'lwc';
import getCourseModuleFields from '@salesforce/apex/LmsCreateCourseModulePopUpController.getCourseModuleFields'
import saveRecord from '@salesforce/apex/LmsRecordCreatePopupController.saveRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class LmsCreateCourseModulePopUp extends LightningElement {
    @api customMetadataName;
    @api recordId;
    @track userInput = {};
    fileName = '';
    fileExtension = '';
    @track defaultVal;
    @track attachment = [];
    @track requiredFields = [];
    page = 1;
    lastPage
    @track processedFields;
    showFields = false;
    header = 'Set up your course module';
    moduleType;
    section;
    @track fieldBindedValue = {};
    @track fields
    isDisabledNextButton = true;
    //it will hold required fileds present in this page
    requiredFieldInPage;
    fieldApiAndLabel = new Map();



    // explicitly make fields required
    extraRequiredField = ['Quiz_Header__c', 'Quiz_Question_1__c', 'Correct_Answer_of_Quiz_1__c', 'Other_Optional_Answers_for_Quiz_1__c', 'iSpring_HTML_File_Link__c'];

    //radio button options
    options = [
        { label: 'Video Session: Create a session with video content for learners to watch.', value: 'Video Session' },
        { label: 'Quiz Module: Create an interactive quiz.', value: 'Quiz Module' }
    ];


    connectedCallback() {
        this.processedFields = this.filteredFields();
    }

    //handle radio button on frist page
    handleRadioChange(eve) {
        //console.log(eve.target.value)
        this.moduleType = eve.target.value;
        this.isDisabledNextButton = false;
        this.getCourseModuleFields(this.recordId, this.moduleType)
    }


    filteredFields() {
        if (!this.fields) return [];
        const pageConfig = this.fields[`page${this.page}`];
        console.log('pageConfig', JSON.stringify(pageConfig));



        if (!pageConfig || !pageConfig.fields) return [];

        this.section = pageConfig.sectionType;
        this.header = pageConfig.header;

        return Object.entries(pageConfig.fields).map(([fieldName, fieldConfig]) => {
            if (fieldConfig.type === 'REFERENCE') {
                this.userInput[fieldName] = this.recordId;
                this.defaultVal = fieldConfig.defaultValue;
            }
            if (fieldConfig.required || this.extraRequiredField.includes(fieldName)) {
                this.requiredFields.push(fieldName);
            }

            console.log("this.requiredFields", JSON.stringify(this.requiredFields))

            // new---->>>  
            this.fieldApiAndLabel.set(fieldName, fieldConfig.label)

            return {
                apiName: fieldName,
                label: fieldConfig.label,
                type: fieldConfig.type,
                options: fieldConfig.options ? fieldConfig.options.map(option => ({ label: option, value: option })) : [],
                isCheckbox: fieldConfig.type === 'checkbox',
                isPicklist: fieldConfig.type === 'PICKLIST',
                isFile: fieldConfig.type === 'file',
                isText: ['STRING', 'TEXTAREA', 'password', 'email', 'tel', 'url'].includes(fieldConfig.type),
                isDate: fieldConfig.type === 'date',
                isDatetimeLocal: fieldConfig.type === 'datetime-local',
                isNumber: ['NUMBER', 'DOUBLE'].includes(fieldConfig.type),
                isSearch: fieldConfig.type === 'search',
                isLookup: fieldConfig.type === 'REFERENCE',
                isRequired: fieldConfig.required || this.extraRequiredField.includes(fieldName)
            };
        });
    }



    nextPage() {
        //to  move to next page from 1st page ( radio button)
        if (this.moduleType && this.showFields == false) {
            this.showFields = true;
        } else {
            if (this.page < this.lastPage && this.showFields == true) {
                //this.page += 1;
                for (let key of this.requiredFields) {
                    if (!this.userInput[key] || this.userInput[key] === '') {
                        let requireField = this.fieldApiAndLabel.get(key);
                        this.showToast('Error', `The ${requireField} cannot be blank.`, 'error');
                        return;
                    } 
                }
               {
                        this.page += 1;
                        this.requiredFields = [];
                        this.processedFields = this.filteredFields();
                    }
            }
        }
    }

    previousPage() {
        if (this.page > 1) {
            this.requiredFields = [];
            this.page -= 1;
            this.processedFields = this.filteredFields();
        }
    }

    get showPreviousButton() {
        return this.page > 1
    }

    get showAddMoreButton() {
        return this.section == 'question' && this.page < this.lastPage
    }

    get islastPage() {
        return this.page >= this.lastPage
    }



    // data binded with input 
    get processedFieldsWithValues() {
        return this.processedFields.map(field => ({
            ...field,
            value: this.userInput[field.apiName] || ''
        }));
    }

    handleInputChange(event) {
        const fieldName = event.target.dataset.id;
        let fieldValue = event.target.value;

        if (event.target.type === 'checkbox') {
            fieldValue = event.target.checked;
        }

        if (event.target.type === 'file') {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64Data = reader.result.split(',')[1];
                    this.fileName = file.name;
                    this.fileExtension = file.name.split('.').pop();

                    this.userInput = { ...this.userInput, [fieldName]: base64Data };
                };
                reader.readAsDataURL(file);
                return;
            }
        } else {
            this.userInput = { ...this.userInput, [fieldName]: fieldValue };
        }

        console.log('Current user input:', JSON.stringify(this.userInput));
    }




    // Fetch the fields dynamically
    getCourseModuleFields(recordId, moduleType) {
        getCourseModuleFields({ recordId: recordId, moduleType: moduleType })
            .then((res) => {
                this.fields = { ...res };
                // console.log(JSON.stringify(res));
                this.processedFields = this.filteredFields();
                this.lastPage = Object.keys(res).length;
            })
            .catch((error) => {
                console.error('Error fetching fields:', error);
            });
    }


    close() {
        this.dispatchEvent(new CustomEvent('closerecordcreatepopup'))
    }




    saveRecord() {
        // console.log('Required Fields:', this.requiredFields);
        console.log('User Input:', this.userInput);

        //error message if all input bnlk
        if (Object.keys(this.userInput).length === 0) {
            this.showToast('Error', 'Please fill in the required fields.', 'error');
            return;
        }
        //error if any required fld blnk
        // for (let key of this.requiredFields) {
        //     if (!this.userInput[key] || this.userInput[key] === '') {
        //         this.showToast('Error', `The required field cannot be blank.`, 'error');
        //         return;
        //     }
        // }


 for (let key of this.requiredFields) {
                    //console.log('shaon106',key)
                    if (!this.userInput[key] || this.userInput[key] === '') {
                        let requireField = this.fieldApiAndLabel.get(key);
                        this.showToast('Error', `The ${requireField} cannot be blank.`, 'error');
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



        //console.log('called 211')
        //static onbject name 
        let objectName = 'LMS_Course_Module__c';
        saveRecord({ objectName: objectName, userInput: this.userInput, base64ImageData: attachmentFound, fileExtension: this.fileExtension })
            .then((res) => {
                // console.log('called 216')
                this.showToast('Success', 'Record has been successfully saved', 'success');
                this.close();
                //console.log('response',res)
                //catch the event if you want do anything after save
                this.dispatchEvent(new CustomEvent('recordsaved', { bubbles: true, composed: true }));
            })
            .catch((err) => {
                // console.log("Error:", err);
                this.showToast('Error', 'An error occurred while saving the record', 'error');
            });
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