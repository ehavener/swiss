import { Component } from "react";

import './Home.css';

export default class Home extends Component {

    constructor(props) {
        super(props);
        this.state = {
            user: {},
            prompt: '',
            threads: [],
            selectedThreadId: null,
            messages: [],
            sendButtonEnabled: true,
            creatingNewThread: true
        };

        this.handlePromptChange = this.handlePromptChange.bind(this);
        this.handleSendClick = this.handleSendClick.bind(this);
        this.fetchUser = this.fetchUser.bind(this);
        this.fetchThreads = this.fetchThreads.bind(this);
        this.fetchMessages = this.fetchMessages.bind(this);
        this.handleThreadClick = this.handleThreadClick.bind(this);
        this.handleNewThreadClick = this.handleNewThreadClick.bind(this);
        this.handleLogoutClick = this.handleLogoutClick.bind(this);
        this.handleExampleClick = this.handleExampleClick.bind(this);
    }

    componentDidMount() {
        this.fetchUser();
        this.fetchThreads();
    }

    checkAuth(data) {
        if (data["detail"] == "Could not validate credentials") {
            console.warn("User not authorized or token expired. Redirecting.")
            window.location.replace(`${window.location.origin}/sign-in`);
        }
    }

    handleLogoutClick(event) {
        localStorage.removeItem("ot_access_token")
        window.location.replace(`${window.location.origin}/sign-in`);
    }

    handlePromptChange(event) {
        this.setState({ prompt: event.target.value });
    }

    fetchUser() {
        const url = "http://127.0.0.1:8000/users/me"
        fetch(url, {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("ot_access_token")}`
            },
        })
            .then((response) => response.json())
            .then(data => {
                this.checkAuth(data);
                this.setState({ ...this.state, user: data })
            })
    }

    fetchThreads(event) {
        const url = "http://127.0.0.1:8000/threads/"
        fetch(url, {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("ot_access_token")}`
            },
        })
            .then((response) => response.json())
            .then(data => {
                this.checkAuth(data);
                this.fetchMessages( data[0].id);
                this.setState({ ...this.state, threads: data })
            })
    }

    fetchMessages(thread_id) {
        const url = `http://127.0.0.1:8000/threads/${thread_id}/messages`
        fetch(url, {
            method: "GET",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("ot_access_token")}`
            },
        })
            .then((response) => response.json())
            .then(data => {
                this.checkAuth(data);
                this.setState({ ...this.state, messages: data })
            })
    }

    handleThreadClick({currentTarget}) {
        const threadId = currentTarget.value
        this.setState({
            ...this.state,
            selectedThreadId: threadId,
            creatingNewThread: false
        })
        this.fetchMessages(threadId)
    }

    handleNewThreadClick(event) {
        // create a temporary thread on the frontend where the user can send an initial message
        this.setState({
            ...this.state,
            creatingNewThread: true,
            selectedThreadId: null
        })
    }

    handleSendClick(event) {
        this.setState({ ...this.state, sendButtonEnabled: false })

        // Create a new thread if on the welcome/new thread page
        if (this.state.selectedThreadId == null) {
            const url = "http://127.0.0.1:8000/threads/"
            fetch(url, {
                method: "POST",
                mode: "cors",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization' : `Bearer ${localStorage.getItem("ot_access_token")}`
                },
                body: JSON.stringify({ title: new Date().toLocaleString() })
            })
                .then((response) => response.json())
                .then(data => {
                    this.checkAuth(data);
                    this.setState({
                        ...this.state,
                        threads: this.state.threads.concat([data]),
                        selectedThreadId: data["id"],
                        messages: []
                    })

                    const url = `http://127.0.0.1:8000/threads/${data["id"]}/messages`;
                    fetch(url, {
                        method: "POST",
                        mode: "cors",
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization' : `Bearer ${localStorage.getItem("ot_access_token")}`
                        },
                        body: JSON.stringify({ text: this.state.prompt })
                    })
                        .then((response) => response.json())
                        .then(data => {
                            this.checkAuth(data);
                            this.setState({
                                ...this.state,
                                messages: data,
                                prompt: '',
                                sendButtonEnabled: true,
                                creatingNewThread: false
                            })
                        })
                })
        } else {
            const thread_id = this.state.selectedThreadId;
            const url = `http://127.0.0.1:8000/threads/${thread_id}/messages`;
            fetch(url, {
                method: "POST",
                mode: "cors",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization' : `Bearer ${localStorage.getItem("ot_access_token")}`
                },
                body: JSON.stringify({ text: this.state.prompt })
            })
                .then((response) => response.json())
                .then(data => {
                    this.checkAuth(data);
                    this.setState({
                        ...this.state,
                        messages: data,
                        prompt: '',
                        sendButtonEnabled: true
                    })
                })
        }
    }

    handleExampleClick(event) {
        this.setState({
            ...this.state,
            prompt: event.target.value,
        })
    }

    render() {
        const threadListItems = this.state.threads.map(thread => {
            return (
                <div key={thread.id} className="thread-list-item">
                    <button type="button" title={thread.title} value={thread.id}
                            className={this.state.selectedThreadId == thread.id ? 'selected' : ''}
                            onClick={this.handleThreadClick}>
                        {thread.title}
                    </button>
                </div>)
        })

        const messageListItems = this.state.messages.map(message => {
            return (<div key={message.id} className={`${message.type} message-list-item`}>{message.text}</div>)
        })

        const examplePromptStrings = [
            "Are there any holidays next month?",
            "How hot would Venus be if it had Earth's atmosphere?",
            "What is the most popular imported car in North America?"
        ];

        const examplePrompts = examplePromptStrings.map(examplePromptString => {
            return <button type="button" value={examplePromptString} onClick={this.handleExampleClick}
                           className="example-prompt-button">{examplePromptString} →</button>
        })

        const spinner = <div className="spinner"></div>;

        const sendButton = <button type="button" onClick={this.handleSendClick}>Send</button>;

        const welcomeScreen = <div className="welcome-screen">
            <h1>Open Toolformer</h1>
            <div className="example-prompts">
                {examplePrompts}
            </div>
        </div>;

        const messageList = <div className="message-list-container">
            <div className="message-list">
                {messageListItems}
            </div>
        </div>;

        return (
            <div className="home-container">
                <div className="sidebar">
                    <div className="thread-list">
                        <div>
                            <button style={{width: "100%", marginBottom: "8px"}}
                                    type="button" onClick={this.handleNewThreadClick}>
                                New thread
                            </button>
                        </div>
                        {threadListItems}
                    </div>
                    <div className="user-details">
                        <div className="username">{this.state.user.email}</div>
                        <div className="sign-out">
                            <button type="button" onClick={this.handleLogoutClick}>Sign out</button>
                        </div>
                    </div>
                </div>
                <div className="content">
                    {this.state.creatingNewThread ? welcomeScreen : messageList}
                    <div className="compose-message-container">
                        <div className="message-text">
                            <textarea value={this.state.prompt} disabled={!this.state.sendButtonEnabled} onChange={this.handlePromptChange} rows="6"/>
                        </div>
                        <div className="message-send">
                            {this.state.sendButtonEnabled ? sendButton : spinner}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}