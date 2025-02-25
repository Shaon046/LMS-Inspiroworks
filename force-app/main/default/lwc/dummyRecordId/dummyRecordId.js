import { LightningElement, wire ,api} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
export default class DummyRecordId extends LightningElement {

    @api recordId; // This will automatically get the recordId if the component is placed on a Record Page
    @api objectName;

    // Any other logic you want to define for the component goes here
    connectedCallback() {
        console.log('recordId:', this.recordId);
        console.log('objectName:', this.objectName);
    }
}