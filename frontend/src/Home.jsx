import { Component } from "react";
import { useNavigate } from "react-router-dom";

import './Home.css';

export default class Home extends Component {


    constructor(props) {
        super(props);
        this.state = {
            user: {},
            prompt: '',
            threads: [],
            selected_thread_id: 0,
            messages: []
        };

        this.handlePromptChange = this.handlePromptChange.bind(this);
        this.handleSendClick = this.handleSendClick.bind(this);
        this.fetchUser = this.fetchUser.bind(this);
        this.fetchThreads = this.fetchThreads.bind(this);
        this.fetchMessages = this.fetchMessages.bind(this);
        this.handleThreadClick = this.handleThreadClick.bind(this);
        this.handleNewThreadClick = this.handleNewThreadClick.bind(this);
        this.handleLogoutClick = this.handleLogoutClick.bind(this);
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
        this.setState({ ...this.state, selected_thread_id: threadId })
        this.fetchMessages(threadId)
    }

    handleNewThreadClick(event) {
        const url = "http://127.0.0.1:8000/threads/"
        fetch(url, {
            method: "POST",
            mode: "cors",
            headers: {
                'Content-Type': 'application/json',
                'Authorization' : `Bearer ${localStorage.getItem("ot_access_token")}`
            },
            body: JSON.stringify({ title: "new thread" })
        })
            .then((response) => response.json())
            .then(data => {
                this.checkAuth(data);
                this.setState({
                    ...this.state,
                    threads: this.state.threads.concat([data]),
                    messages: []
                })
            })
    }

    handleSendClick(event) {
        const thread_id = this.state.selected_thread_id;
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
                    messages: data
                })
            })
    }

    render() {
        const threadListItems = this.state.threads.map(thread => {
            return (
                <div key={thread.id} className="thread-list-item">
                    <button type="button" value={thread.id} onClick={this.handleThreadClick}> {thread.title} </button>
                </div>)
        })

        const messageListItems = this.state.messages.map(message => {
            return (<div key={message.id} className={`${message.type} message-list-item`}>{message.text}</div>)
        })

        return (
            <div className="home-container">
                <div className="sidebar">
                    <div className="thread-list">
                        <div>
                            <button style={{width: "100%"}} type="button" onClick={this.handleNewThreadClick}>
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
                    <div className="message-list-container">
                        <div className="message-list">
                            {messageListItems}
                        </div>
                    </div>
                    <div className="compose-message-container">
                        <div className="message-text">
                            <textarea onChange={this.handlePromptChange} rows="6"/>
                        </div>
                        <div className="message-send">
                            <button type="button" onClick={this.handleSendClick}>Send</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}