import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import userDetails from '@salesforce/apex/LMSExternaluserProfileController.userDetails';
import uploadFile from '@salesforce/apex/LMSExternaluserProfileController.uploadFile';
import updateUserDetails from '@salesforce/apex/LMSExternaluserProfileController.updateUserDetails';
import changeExternalUserPassword from '@salesforce/apex/LMSExternaluserProfileController.changeExternalUserPassword';

export default class LmsExternalUserProfileDetails extends LightningElement {
    @track uploadedImage;
    @track base64Image;
    @track uploadedFile = {};
    @track userDetails = {'firstName':'','email':'','mobilePhone':'','lastName':'', 'userName':''};
    @track isReadOnly = true;
    @track isEdit = false;
    @track isLoading = false;
    @track enableResetPassword = false;
    @track isEmailValid = true;
    @track isMobileNumberValid = true;
    @track errorMessage = '';
    @track isPasswordMismatch = true;
    @track newPassword = '';
    @track confirmPassword = '';
    @track currentPassword = '';
    @track isValueUnchanged = true;
    @track isImageSaveDisable = true;


    @track passInputTypes = {
        currentPassword: 'password',
        newPassword: 'password',
        confirmPassword: 'password',
    };

    @track toggleIcons = {
        currentPassword: 'utility:hide',
        newPassword: 'utility:hide',
        confirmPassword: 'utility:hide',
    };

    @track toggleIconTitles = {
        currentPassword: 'Show Pass',
        newPassword: 'Show Pass',
        confirmPassword: 'Show Pass',
    };

    maxFileSize = 2 * 1024 * 1024;
    allowedFileTypes = ['image/jpeg', 'image/png'];
   

    connectedCallback() {
        this.isLoading = true;
        this.getUserDetails();


    }

    getUserDetails() {
       
        userDetails()
            .then(data => {
                console.log('User Details=?????', JSON.stringify(data));
                console.log(window.location.origin);
                this.userDetails = data;
                this.uploadedImage = data.contentVersion ? '/sfc/servlet.shepherd/version/download/' + data.profilePictureUrl : data.profilePictureUrl;
            })
            .catch(error => {
                console.log('user error', error);
            })
            .finally(() => {
                this.isLoading = false;
            })

    }

    // handleUploadImage(event) {
    //     const uploadedFiles = event.detail.files;
    //     const fileCvId = JSON.parse(JSON.stringify(uploadedFiles))[0].contentVersionId;
    //     const fileName = JSON.parse(JSON.stringify(uploadedFiles))[0].name;
    //     this.uploadedImage = '/sfc/servlet.shepherd/version/download/' + fileCvId;

    //     this.validateFile(fileCvId, fileName);
    //     console.log(fileCvId, fileName);

    // }

    // async validateFile(contentVersionId, fileName) {
    //     try {
    //         const fileSize = await getFileSizeFromServer({ contentVersionId });

    //         if (fileSize > this.maxFileSize) {
    //             this.showToast('Error', `File ${fileName} exceeds the size limit of 2MB.`, 'error');

    //             await deleteFileFromServer({ contentVersionId });
    //         } else {

    //             this.showToast('Success', `File ${fileName} uploaded successfully!`, 'success');
    //         }
    //         this.getUserDetails();
    //     } catch (error) {
    //         console.error('Error validating file:', error);
    //         this.showToast('Error', `An error occurred while validating the file.`, 'error');
    //     }
    // }









    handelEditToggle() {
        this.isEdit = !this.isEdit;

        if (!this.isReadOnly) {
            this.getUserDetails();
        }
        this.isReadOnly = !this.isReadOnly;
    }

    handleInputChange(event) {
        const field = event.currentTarget.dataset.id;
        const value = event.currentTarget.value;
        if (field == 'mobilePhone') {
            const regex = /^[\d\+]*$/;
            if (regex.test(value)) {
                this.isMobileNumberValid = true;

            } else {
                this.isMobileNumberValid = false;
                this.showToast('Error', 'Please enter a valid mobile number.', 'error');

            }
            this.userDetails[field] = value;
        } else if (field == 'email') {
            console.log(value);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
            if (emailRegex.test(value)) {
                this.isEmailValid = true;

            } else {
                this.isEmailValid = false;
                this.showToast('Error', 'Please enter a valid email.', 'error');
            }
            this.userDetails[field] = value;
        } else {
            this.userDetails[field] = value;

        }
        this.isValueUnchanged = false;
    }


    saveChanges() {

        let isAnyFieldBlank = false;
        let errorMessage = 'The following fields are blank: ';

        for (let key in this.userDetails) {
            if (this.userDetails[key] === '') {
                isAnyFieldBlank = true;

                errorMessage += this.formatKeyToReadable(key) + ', ';
            }
        }

        console.log(this.isEmailValid, this.isMobileNumberValid);
        if (isAnyFieldBlank) {
            errorMessage = errorMessage.slice(0, -2);
            this.showToast('Error', errorMessage, 'error');
        } else if (!this.isEmailValid || !this.isMobileNumberValid) {
            console.log(this.isEmailValid, this.isMobileNumberValid);

            this.showToast('Error', 'Fill the valid data', 'error');
        } else {
            console.log(this.isEmailValid, this.isMobileNumberValid);

            this.isLoading = true;
            updateUserDetails({ userData: JSON.stringify(this.userDetails) })
                .then(result => {
                    if (result == 'successfully') {
                        this.showToast('Successfull', 'Profile Details updated successfully.', 'success');

                    }
                })
                .catch(error => {
                    this.showToast('Error', 'Profile Details are not updated.', 'error');
                    console.error(error);
                })
                .finally(() => {
                    this.handelEditToggle();
                    this.getUserDetails();
                    this.isLoading = false;
                    this.isValueUnchanged = true;
                })
        }
    }

    toggleResetPassword() {
        this.enableResetPassword = !this.enableResetPassword;
        this.isPasswordMismatch = false;
    }

    handleTogglePassVisibility(event) {
        const fieldId = event.currentTarget.dataset.id;

        console.log(fieldId);
        if (this.passInputTypes[fieldId] === 'password') {
            this.passInputTypes[fieldId] = 'text';
            this.toggleIcons[fieldId] = 'utility:preview';
            this.toggleIconTitles[fieldId] = 'Hide Pass';
        } else {
            this.passInputTypes[fieldId] = 'password';
            this.toggleIcons[fieldId] = 'utility:hide';
            this.toggleIconTitles[fieldId] = 'Show Pass';
        }
    }

    handlePassInput(event) {
        const inputElement = event.currentTarget;
        const inputFieldId = event.currentTarget.dataset.id;
        if (inputFieldId == 'confirmPasswordVal') {
            this.confirmPassword = event.currentTarget.value;
            if (this.newPassword != '') {
                if (this.newPassword != this.confirmPassword) {
                    this.isPasswordMismatch = true;
                    this.errorMessage = 'New Password and Confirm Password do not match'
                } else {
                    this.isPasswordMismatch = false;
                }
            }
        } else if (inputFieldId == 'newPasswordVal') {
            const regex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
            this.newPassword = event.currentTarget.value;
            if (!regex.test(this.newPassword)) {
                inputElement.setCustomValidity(`Password must contain at least one letter and one number.`);
                inputElement.reportValidity();
                return;
            }
            if (this.confirmPassword != '') {
                if (this.confirmPassword != this.newPassword) {
                    this.isPasswordMismatch = true;
                    this.errorMessage = 'New Password and Confirm Password do not match'
                } else {
                    this.isPasswordMismatch = false;
                }
            }
            inputElement.setCustomValidity('');
            inputElement.reportValidity();
        }
    }


    async saveChangePassword() {
        this.toggleResetPassword();
        try {
            if (!this.newPassword || this.newPassword.trim() === '') {
                this.showToast('Error', 'Please enter the password carefully.', 'error');
                return;
            }

            // Call Apex method
            const result = await changeExternalUserPassword({
                userId: this.userDetails.userId,
                newPassword: this.newPassword
            });

            if (result.success) {
                this.message = result.message; // Success message from Apex
                this.showToast('Success', result.message, 'success');
            } else {
                this.message = result.message; // Error message from Apex
                this.showToast('Error', result.message, 'error');
            }
        } catch (error) {
            // Handle unexpected errors (e.g., server or network errors)
            this.message = 'Error: ' + error.body.message;
            this.showToast('Error', 'Something went wrong. Please try again.', 'error');
            console.error('Error:', error);
        }
    }



    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable',
            duration: 3000
        });


        this.dispatchEvent(event);
    }

    formatKeyToReadable(key) {
        return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, str => str.toUpperCase());
    }






    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }

    handleFileChange(event) {
        const file = event.target.files[0];
        console.log(file);
        this.validateAndPreviewFile(file);
        if (file) {
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        const dropZone = this.template.querySelector('.drop-zone');
        dropZone.classList.add('slds-drop-zone_highlight');
    }

    // Handle drag leave event
    handleDragLeave() {
        const dropZone = this.template.querySelector('.drop-zone');
        dropZone.classList.remove('slds-drop-zone_highlight');
    }

    // Handle file drop event
    handleFileDrop(event) {
        event.preventDefault();
        this.handleDragLeave();

        const file = event.dataTransfer.files[0];
        console.log(file);
        if (file) {
            this.validateAndPreviewFile(file);
        }
    }

    // Validate file and preview the image
    validateAndPreviewFile(file) {
        const { size, type } = file;

        if (!this.allowedFileTypes.includes(type)) {
            this.showToast('Warning', 'Invalid file format. Please upload a JPEG or PNG image.', 'warning');
            return;
        }

        if (size > this.maxFileSize) {
            this.showToast('Warning', 'File size exceeds the maximum limit of 2MB.', 'warning');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            this.uploadedImage = reader.result;
            this.base64Image = reader.result.split(',')[1];
            const fileType = file.name.split('.').pop();
            const renamedFileName = `${this.userDetails.contactId}.${fileType}`;
            this.uploadedFile = {
                'filename': renamedFileName,
                'base64': this.base64Image,
                'recordId': this.userDetails.contactId
            }
            this.isImageSaveDisable = false;
        };
        reader.readAsDataURL(file);
    }


    handleSaveProfileImage() {
        this.isImageSaveDisable = true;
        this.isLoading = true;
        const { base64, filename, recordId } = this.uploadedFile;
        uploadFile({ base64, filename, recordId })
            .then(data => {
                this.userDetails.profilePictureUrl = data;
                console.log(JSON.stringify(this.userDetails));
                this.showToast('successfully', 'Profile picture uploaded. ', 'success');
                return;
            })
            .catch(error => {
                console.log('errorupload=?????', error);
                this.showToast('Error', 'Profile picture not uploaded.', 'error');
                return;
            })
            .finally(() => {
                this.isLoading = false;
            })
    }

}