import { LightningElement, track, api, wire } from 'lwc';
import createCart from '@salesforce/apex/LMSCourseDetailPageController.createCart';
import getAllCartItems from '@salesforce/apex/LMSCourseDetailPageController.getAllCartItems';
import removeItemFromCart from '@salesforce/apex/LMSCourseDetailPageController.removeItemFromCart';
import COUNTING_UPDATED_CHANNEL from '@salesforce/messageChannel/Cart_Item__c';
import { subscribe, MessageContext } from 'lightning/messageService';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';




export default class LmsCourseDetailPage extends LightningElement {
    @track isShowModal = false;
    @track seletedCourseId;
    @track seletedCourseName;
    @track seletedCourseType;
    @track cartItems = [];

    @wire(MessageContext)
    messageContext;



    @api showModalBox(seletedId, seletedCourseName, seletedCourseType, seletedCourseFile) {
        console.log('Selected Id in child===>' + JSON.stringify(seletedId));
        this.seletedCourseId = seletedId;
        this.seletedCourseName = seletedCourseName;
        this.seletedCourseType = seletedCourseType;
        this.seletedCourseFile = seletedCourseFile;
        console.log('this.seletedCourseId in child===>' + JSON.stringify(this.seletedCourseId));
        console.log('this.seletedCourseName in child===>' + JSON.stringify(this.seletedCourseName));

        this.handlePopUp();
        this.getAllCart();
    }

    connectedCallback() {
        this.getAllCart();
        this.subscribeToMessageChannel();
    }



    subscribeToMessageChannel() {
        this.subscription = subscribe(
            this.messageContext,
            COUNTING_UPDATED_CHANNEL,
            (message) => {
                this.handleMessage(message)
                console.log(result);
            }
        );
    }

    handleMessage(message) {
        console.log('message received===>' + JSON.stringify(message));
        this.handleCart(message);
        this.getAllCart();
    }

    getAllCart() {
        getAllCartItems()
            .then(result => {
                console.log('Result for cart items:', JSON.stringify(result));

                // Add image URLs to cart items
                const courseFilesMap = result.courseFilesMap;
                const updatedCartItemsList = result.cartItemsList.map(item => {
                    const courseId = item.Course_Id__c;
                    const imageUrl = courseFilesMap[courseId]
                        ? `/sfc/servlet.shepherd/version/download/${courseFilesMap[courseId]}`
                        : null;
                    return { ...item, imageUrl };
                });

                // Update cartItems with the modified list
                this.cartItems = { ...result, cartItemsList: updatedCartItemsList };
                console.log('Updated cart items:89', JSON.stringify(this.cartItems));
            })
            .catch(error => {
                console.error('Error occurred while fetching cart items:', JSON.stringify(error));
            });
    }

    handlePopUp() {
        this.isShowModal = true;
    }

    hideModalBox() {
        this.isShowModal = false;
    }

    handleCart(message) {
        console.log('this.seletedCourseId23 in child===>' + JSON.stringify(this.seletedCourseId));
        createCart({ seletedCourseId: message.cartId })
            .then(result => {
                console.log('result25===>' + JSON.stringify(result));
                // Now open the /cartitems page
                if(result == 'Success' || result == 'Failed'){
                window.open(window.location.origin + '/s/cartitems', '_self');
                }else{
                    this.toast(result);
                }
                console.log('result86===>' + JSON.stringify(result));
            })
            .catch(error => {
                console.log('error28===>' + JSON.stringify(error));
            })
    }

    handleClickCard() {

    }

    handleRemoveFromCart(event) {
        const cartIdItem = event.currentTarget.dataset.id;
        console.log('cartIdItem 68===>' + JSON.stringify(cartIdItem));
        removeItemFromCart({ cartItemId: cartIdItem })
            .then(result => {
                console.log('result71===>' + JSON.stringify(result));
                return refreshApex(this.getAllCart());
            })
            .catch(error => {
                console.log('error74===>' + JSON.stringify(error));
            })
    }


    toast(title){
        const toastEvent = new ShowToastEvent({
            title, 
            variant:"error"

        })

        this.dispatchEvent(toastEvent)
    }
}