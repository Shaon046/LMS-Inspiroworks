import { LightningElement, api, track } from 'lwc';
import getFeedItemRecords from '@salesforce/apex/LMSLearnerChatController.getFeedItemRecords';
import getUserId from '@salesforce/apex/LMSLearnerChatController.getUserId';
import createFeedItem from '@salesforce/apex/LMSLearnerChatController.createFeedItem';
export default class LmsQAChatter extends LightningElement {
    @api isOpen;
    @api parentId;
    @api chatGroupName;
    @track groupChats;
    @track newMessage = '';
    @track isDataReady = false;
    userId;

    connectedCallback() {
        if (this.parentId == '') {
            this.handleClose();
        }
        console.log('parentID', this.parentId);
        getUserId()
            .then(result => {
                this.userId = result.Id;
            })
            .catch(error => {
                console.error('userdata not came', error);
            })

        getFeedItemRecords({ feedParentId: this.parentId })
            .then(result => {
                console.log(result);
                if (result != null) {
                    this.groupChats = result
                        .sort((a, b) => new Date(a.lastModifiedDate) - new Date(b.lastModifiedDate)) // ✅ Sorting in ascending order
                        .map(wrapper => ({
                            id: wrapper.FeedItemId,
                            msg: wrapper.message,
                            rePlayOf:wrapper.replyOf,
                            msgAuthor: (!wrapper.isOwned ? wrapper.authorName : ''),
                            cssClass: 'message-box ' + (!wrapper.isOwned ? 'message-left' : 'message-right')
                        }))
                        ;
                } else {
                    this.groupChats = [];
                }
                this.isDataReady = true;
                console.log('his.groupChats', JSON.stringify(this.groupChats));

                setTimeout(() => {
                    this.scrollToBottom();
                }, 0);
            })
            .catch(error => {
                console.error(error);
            })


    }

    handleClose() {
        console.log('clicked from child');
        this.isDataReady = false;
        const event = new CustomEvent('togglechatbox');
        this.dispatchEvent(event);
    }

    sendMessage() {
        if (!this.newMessage.trim()) {
            return;
        }

        const tempMessage = {
            id: Date.now().toString(),
            msg: this.newMessage,
            cssClass: 'message-box message-right'
        };

        this.groupChats = [...this.groupChats, tempMessage];

        createFeedItem({ parentId: this.parentId, message: this.newMessage, createdById: this.userId })
            .then(result => {
                const newMessage = {
                    id: result.Id,
                    msg: result.Body,
                    megAuthor: (result.CreatedById != this.userId ? result.InsertedBy.FirstName + ' ' + result.InsertedBy.LastName : ''),
                    cssClass: 'message-box ' + (result.CreatedById != this.userId ? 'message-left' : 'message-right')
                };

                this.groupChats = this.groupChats.map(msg =>
                    msg.id === tempMessage.id ? newMessage : msg
                );
            })
            .catch(error => {
                console.log('Message not sent', error);
            });

        this.newMessage = '';
    }

    handleMessageChange(event) {
        this.newMessage = event.target.value;
    }

    scrollToBottom() {
        const chatContainer = this.template.querySelector('.chat-grid');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
}