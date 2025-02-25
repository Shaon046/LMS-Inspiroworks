import { LightningElement, track, api } from 'lwc';
export default class LmsChatterGroupDetails extends LightningElement {
    @api isOpen;
    @api groupDetails;
   
    connectedCallback() {
        if (this.groupDetails) {
            console.log('this.groupDetails', JSON.stringify(this.groupDetails));
            this.membersDetails = this.groupDetails.members;

        }
    }

    handleClose() {
        console.log('clicked from child');
        const event = new CustomEvent('togglepopup');
        this.dispatchEvent(event);
    }
}