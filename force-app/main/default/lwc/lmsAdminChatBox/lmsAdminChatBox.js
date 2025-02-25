import { LightningElement, track, api } from 'lwc';
import getFeedItemsWithComments from '@salesforce/apex/LMSAdminChatController.getFeedItemsWithComments';
import createFeedComment from '@salesforce/apex/LMSAdminChatController.createFeedComment';
import insertFeedItem from '@salesforce/apex/LMSAdminChatController.insertFeedItem';
import getLoggedInUserDetails from '@salesforce/apex/LMSUserDetailsController.getLoggedInUserDetails';
export default class LmsAdminChatBox extends LightningElement {
    @api chatGroupId;
    @api chatGroupName;
    @track chats;
    @track filteredChats;
    @track newMessageText = '';
    @track searchText = '';
    userId;
    userName;
    userProfilePicUrl;
    cssAsPerUserType;

    connectedCallback() {
        this.getGroupChats();
        getLoggedInUserDetails()
            .then(result => {
                this.userId = result.userId;
                this.userName = result.userName;
                this.userProfilePicUrl = result.profileImage;
                this.cssAsPerUserType = result.userType == 'Internal' ? 'chat-warpper-internal' : 'chat-warpper-external';
            })
            .catch(error => {
                console.error('userdata not came', error);
            })
    }

    getGroupChats() {
        getFeedItemsWithComments({ parentId: this.chatGroupId })
            .then(result => {
                console.log('admin chat', result);
                this.chats = result;
                if (result) {
                    this.chats = this.chats.map(item => ({
                        ...item,
                        postDate: this.formatDate(item.postDate),
                        showReplyBox: false,
                        isExpanded: false,
                        contentStyle: "",
                        replyText: "",
                        comments: item.comments.map(comment => ({
                            ...comment,
                            commentDate: this.formatDate(comment.commentDate)
                        }))
                    }));
                }
                this.filteredChats = [...this.chats];
                setTimeout(() => {
                    this.scrollToBottom(this.cssAsPerUserType);
                }, 0);
            })
            .catch(error => {
                console.error('adminchat error', error);
            })
    }

    handleNewMsgChange(event) {
        this.newMessageText = event.target.value;
        console.log(this.newMessageText);
    }

    submitNewMessage(event) {
        const groupId = event.currentTarget.dataset.id;
        console.log(groupId);
        console.log(this.newMessageText);
        insertFeedItem({ parentId: groupId, message: this.newMessageText, createdById: this.userId })
            .then(newMsg => {
                if (newMsg) {
                    console.log('New message received:', newMsg);
                    console.log('Current chat list:', JSON.stringify(this.chats));

                    // this.chats = [
                    //     ...this.chats,
                    //     {
                    //         feedItemId: newMsg.feedItemId,
                    //         body: newMsg.body,
                    //         postDate: this.formatDate(newMsg.postDate),
                    //         postAuthor: newMsg.postAuthor,
                    //         authorProfilePictureUrl: newMsg.authorProfilePictureUrl,
                    //         comments: newMsg.comments || []
                    //     },

                    // ];

                    const newChat = {
                        feedItemId: newMsg.feedItemId,
                        body: newMsg.body,
                        postDate: this.formatDate(newMsg.postDate),
                        postAuthor: newMsg.postAuthor,
                        authorProfilePictureUrl: newMsg.authorProfilePictureUrl,
                        comments: newMsg.comments || []
                    };

                    this.chats = [...this.chats, newChat]

                }
                if (this.searchText && newMsg.postAuthor.toLowerCase().includes(this.searchText)) {
                    this.filteredChats = [...this.filteredChats, newChat];
                } else {
                    this.filteredChats = [...this.chats];
                }
                setTimeout(() => {
                    this.scrollToBottom(this.cssAsPerUserType);
                }, 0);
            })
            .catch(error => {
                console.error('New Message Inertion Error', error);
            })

        this.newMessageText = '';


    }


    toggleReplyBox(event) {
        const postId = event.target.dataset.id;
        this.chats = this.chats.map(chat => {
            if (chat.feedItemId === postId) {
                return { ...chat, showReplyBox: !chat.showReplyBox };
            }
            return chat;
        });
        this.filteredChats = [...this.chats];
    }

    handleReplyChange(event) {
        const postId = event.target.dataset.id;
        const newText = event.target.value;
        this.chats = this.chats.map(reply => {
            if (reply.feedItemId === postId) {
                return { ...reply, replyText: newText };
            }
            return reply;
        });
    }

    submitReply(event) {
        const postId = event.target.dataset.id;
        const post = this.chats.find(p => p.feedItemId === postId);
        console.log(`Reply Submitted for Post ${postId}:`, post.replyText);
        this.chats = this.chats.map(chat => {
            if (chat.feedItemId === postId) {
                return { ...chat, showReplyBox: !chat.showReplyBox };
            }
            return chat;
        });
        createFeedComment({ feedItemId: postId, body: post.replyText })
            .then(result => {
                console.log('new reply entry:', result);
                this.chats = this.chats.map(chat => {
                    if (chat.feedItemId === postId) {
                        return {
                            ...chat,
                            isExpanded: true,
                            contentStyle: "comments-section",
                            comments: [
                                ...chat.comments,
                                {
                                    commentAuthor: result.commentAuthor,
                                    commentAuthPictureUrl: result.commentAuthPictureUrl,
                                    commentBody: result.commentBody,
                                    commentDate: this.formatDate(result.commentDate),
                                    feedCommentId: result.feedCommentId
                                }
                            ]
                        };
                    }
                    return chat;
                });
                this.filteredChats = [...this.chats];
                setTimeout(() => {
                    this.scrollToBottom('comments-section');
                }, 0);
                console.log('updated chat', this.chats);

            })
            .catch(error => {
                console.error('No valid comment data returned:', error);

            })

    }

    toggleExpandChat(event) {
        const postId = event.target.dataset.id;
        this.chats = this.chats.map(chat => {
            if (chat.feedItemId === postId) {
                const hasComments = chat.comments && chat.comments.length > 0;
                console.log(hasComments);
                return {
                    ...chat,
                    isExpanded: !chat.isExpanded,
                    contentStyle: hasComments
                        ? (chat.isExpanded ? "" : "comments-section")
                        : ""
                };
            }
            return chat;
        });
        this.filteredChats = [...this.chats];

        setTimeout(() => {
            this.scrollToBottom('comments-section');
        }, 0);
    }


    handleSearch(event) {
        this.searchText = event.target.value.toLowerCase();


        if (!this.searchText) {
            this.filteredChats = [...this.chats];
            return;
        }

        this.filteredChats = this.chats.filter(chat =>
            chat.postAuthor.toLowerCase().includes(this.searchText)
        );
        setTimeout(() => {
            this.scrollToBottom(this.cssAsPerUserType);
        }, 0);

    }

    clearSearchBox() {
        this.searchText = '';
        this.filteredChats = [...this.chats];

        const inputEl = this.template.querySelector('.search-input');
        if (inputEl) {
            inputEl.value = '';
            inputEl.blur();
        }
        setTimeout(() => {
            this.scrollToBottom(this.cssAsPerUserType);
        }, 0);
    }

    refreshChat() {
        this.searchText != '' ? this.clearSearchBox() : null;
        this.getGroupChats();
    }




    formatDate(isoString) {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const use24HourFormat = false;
        if (!isoString) return '';
        const date = new Date(isoString);
        const day = date.getUTCDate();
        const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
        const year = date.getUTCFullYear();
        const options = {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: use24HourFormat ? 'h23' : 'h12'
        };

        const formattedTime = new Intl.DateTimeFormat('en-US', options).format(date);
        const suffix = (day >= 11 && day <= 13) ? 'th' :
            (day % 10 === 1) ? 'st' :
                (day % 10 === 2) ? 'nd' :
                    (day % 10 === 3) ? 'rd' : 'th';

        return `${day}${suffix} ${month} ${year} at ${formattedTime}`;
    }


    scrollToBottom(className) {
        const chatContainer = this.template.querySelector(`.${className}`);
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    toggleBackToGroups() {
        const event = new CustomEvent('togglebacktogroup');
        this.dispatchEvent(event);
    }

}