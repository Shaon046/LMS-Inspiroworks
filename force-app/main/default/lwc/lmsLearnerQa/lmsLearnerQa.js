import { LightningElement, api, track } from 'lwc';
import getFeedItemRecords from '@salesforce/apex/LMSLearnerChatController.getFeedItemRecords';
import getUserId from '@salesforce/apex/LMSLearnerChatController.getUserId';
import createFeedItem from '@salesforce/apex/LMSLearnerChatController.createFeedItem';

export default class LmsLearnerQa extends LightningElement {

    @api parentId;
    @api chatGroupName;
    @track groupChats;
    @track newMessage = '';
    @track isDataReady = false;
    userId;
    isAnswer = false;

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
                        .sort((a, b) => new Date(a.lastModifiedDate) - new Date(b.lastModifiedDate)) // Sort messages by date
                        .reduce((acc, wrapper) => {
                            let formattedDate = new Date(wrapper.lastModifiedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                            if (!acc[formattedDate]) {
                                acc[formattedDate] = {
                                    date: formattedDate,
                                    messages: []
                                };
                            }

                            acc[formattedDate].messages.push({
                                feedItemId: wrapper.feedItemId,
                                msg: wrapper.message,
                                replayOf: wrapper.replyOf ? (wrapper.replyOf.length > 100 ? wrapper.replyOf.substring(0, 100) + '...' : wrapper.replyOf) : null,
                                replayOfId: wrapper.replyOfFeedId,
                                msgAuthor: (!wrapper.isOwned ? wrapper.authorName : ''),
                                lastmodifyed: wrapper.lastModifiedDate,
                                msgTime: this.formatTime(wrapper.lastModifiedDate),
                                profileImg: wrapper.authorProfileImg,
                                alignClass: 'message-box ' + (!wrapper.isOwned ? 'message-left-align' : 'message-right-align'),
                                msgCss: 'messages ' + (!wrapper.isOwned ? 'message-left' : 'message-right'),
                                timingCss: 'message-time ' + (!wrapper.isOwned ? 'message-timing-left' : 'message-timing-right'),
                                tagMessageCss: 'pin-message ' + (!wrapper.isOwned ? 'othersAnswer' : 'myAnswer'),
                                msgWrapperCss: 'message-wrapper ' + (!wrapper.isOwned ? 'image-left-align' : 'image-right-align')
                            });

                            return acc;
                        }, {});

                    this.groupChats = Object.values(this.groupChats);
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



    sendMessage() {
        if (!this.newMessage.trim()) {
            return;
        }


        // const tempMessage = {
        //     feedItemId: Date.now().toString(),
        //     msg: this.newMessage,
        //     alignClass: 'message-box message-right-align',
        //     alignClass: 'message-box message-right-align',
        //     msgCss: 'messages message-right',
        //     timingCss: 'message-time message-timing-right',
        //     tagMessageCss: 'pin-message myAnswer',
        //     msgWrapperCss: 'message-wrapper image-right-align'
        // };


        // this.groupChats = [...this.groupChats, tempMessage];


        // setTimeout(() => {
        //     this.scrollToBottom();
        // }, 0);


        createFeedItem({ parentId: this.parentId, message: this.newMessage, createdById: this.userId })
            .then(result => {
                result = result[0];
                console.log('this.result', JSON.stringify(result));
                console.log("Raw lastModifiedDate:", result.lastModifiedDate);

                let lastModified = result.lastModifiedDate ? new Date(result.lastModifiedDate) : null;

                if (!lastModified || isNaN(lastModified.getTime())) {
                    console.error("Invalid lastModifiedDate:", result.lastModifiedDate);
                    return;
                }

                let formattedDate = lastModified.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });

                const newMessage = {
                    feedItemId: result.feedItemId,
                    msg: result.message,
                    replayOf: null,
                    replayOfId: null,
                    msgAuthor: (!result.isOwned ? result.authorName : ''),
                    lastmodifyed: result.lastModifiedDate,
                    profileImg: result.authorProfileImg,
                    msgTime: this.formatTime(result.lastModifiedDate),
                    alignClass: 'message-box ' + (!result.isOwned ? 'message-left-align' : 'message-right-align'),
                    msgCss: 'messages ' + (!result.isOwned ? 'message-left' : 'message-right'),
                    timingCss: 'message-time ' + (!result.isOwned ? 'message-timing-left' : 'message-timing-right'),
                    tagMessageCss: 'pin-message ' + (!result.isOwned ? 'othersAnswer' : 'myAnswer'),
                    msgWrapperCss: 'message-wrapper ' + (!result.isOwned ? 'image-left-align' : 'image-right-align')
                };

                if (Array.isArray(this.groupChats)) {
                    this.groupChats = this.groupChats.reduce((acc, group) => {
                        acc[group.date] = group;
                        return acc;
                    }, {});
                }

                if (!this.groupChats[formattedDate]) {
                    this.groupChats[formattedDate] = {
                        date: formattedDate,
                        messages: []
                    };
                }

                this.groupChats[formattedDate].messages.push(newMessage);

                this.groupChats = Object.values(this.groupChats);
                setTimeout(() => {
                    this.scrollToBottom();
                }, 0);
                console.log(JSON.stringify(this.groupChats));
            })
            .catch(error => {
                console.log('Message not sent', JSON.stringify(error));
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



    getOrgMsg(event) {
        const msgId = event.currentTarget.dataset.id;
        const messageElement = this.template.querySelector(`[data-id="${msgId}"]`);

        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });


        }

        const childMessagesElement = messageElement.querySelector('.messages');

        if (childMessagesElement) {
            if (childMessagesElement.classList.contains('message-left')) {
                childMessagesElement.classList.add('highlight-left');
            } else if (childMessagesElement.classList.contains('message-right')) {
                childMessagesElement.classList.add('highlight-right');
            }

            setTimeout(() => {
                childMessagesElement.classList.remove('highlight-left');
                childMessagesElement.classList.remove('highlight-right');
            }, 1000);
        }

    }
    formatTime(dateString) {
        let formattedTime = new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return formattedTime.replace('am', 'AM').replace('pm', 'PM');
    }
}