import { Component } from "react";

import './Home.css';

export default class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            prompt: '',
            output: ''
        };

        this.handlePromptChange = this.handlePromptChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handlePromptChange(event) {
        this.setState({ prompt: event.target.value });
    }

    handleSubmit(event) {
        const url = "http://127.0.0.1:8000/toolformer/prompts/"
        fetch(url, {
            method: "POST",
            mode: "cors",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: this.state.prompt })
        })
            .then((response) => response.json())
            .then(data => {
                console.log(data)
                this.setState({ ...this.state, output: data['text'] })
            })

        event.preventDefault();
    }

    render() {
        const old = (<div>
            <h1>Toolformer</h1>
            <input placeholder="Enter a prompt" type="text"
                   value={this.state.prompt} onChange={this.handlePromptChange}/>
            <button type="button" onClick={this.handleSubmit}>Submit</button>
            <p>{this.state.output}</p>
        </div>);



        return (
            <div class="container">
                <div class="sidebar">
                    <div class="thread-list">
                        <div class="thread-list-item">thread1</div>
                        <div class="thread-list-item">thread2</div>
                        <div class="thread-list-item">thread3</div>
                    </div>
                    <div class="user-details">
                        <div class="username">username</div>
                        <div class="sign-out">Sign out</div>
                    </div>
                </div>
                <div class="content">
                    <div class="message-log-container">
                        <div class="message-log">
                            <div class="message0">...</div>
                            <div class="message1">...</div>
                            <div class="message2">...</div>
                        </div>
                    </div>
                    <div class="compose-message-container">
                        <div class="message-text">New message text</div>
                        <div class="message-send">Send</div>
                    </div>
                </div>
            </div>
        );
    }
}