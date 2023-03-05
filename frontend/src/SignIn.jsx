import { Component } from "react";

export default class SignIn extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: ''
        };

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleEmailChange(event) {
        this.setState({
            email: event.target.value
        });
    }

    handlePasswordChange(event) {
        this.setState({
            password: event.target.value
        });
    }

    handleSubmit(event) {
        const url = "http://127.0.0.1:8000/sign-in"
        fetch(url, {
            method: "POST",
            mode: "cors",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: this.state.prompt,
                password: this.state.password
            })
        })
            .then((response) => response.json())
            .then(data => {
                console.log(data)
                // this.setState({ ...this.state, output: data['text'] })
            })

        event.preventDefault();
    }

    render() {
        return(
            <div>
                <p>Sign in</p>
                <input placeholder="Email" type="email" value={this.state.email} onChange={this.handleEmailChange}/>
                <input placeholder="Password" type="password" value={this.state.password} onChange={this.handlePasswordChange}/>
                <button type="button" onClick={this.handleSubmit}>Submit</button>
            </div>
        )
    }
}