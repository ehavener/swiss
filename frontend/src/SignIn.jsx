import { Component } from "react";
import './SignIn.css'

export default class SignIn extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: ''
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSignUpButtonClick = this.handleSignUpButtonClick.bind(this);
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
        const url = "http://127.0.0.1:8000/token"
        const formData = new FormData();
        formData.set("username", this.state.email)
        formData.set("password", this.state.password)
        fetch(url, {
            method: "POST",
            mode: "cors",
            body: formData
        })
            .then((response) => response.json())
            .then(data => {
                this.setState({ ...this.state, bearer: data['access_token'] })
                localStorage.setItem("ot_access_token", data['access_token']);
                window.location.replace(`${window.location.origin}/`);
            })

        event.preventDefault();
    }

    handleSignUpButtonClick() {
        window.location.replace(`${window.location.origin}/sign-up`);
    }

    render() {
        return(
            <div>
                <nav className="sign-in-nav">
                    <button type="button" onClick={this.handleSignUpButtonClick}>Sign Up</button>
                </nav>
                <div className="sign-in-container">
                    <p>Sign in</p>
                    <input className="email-input" placeholder="Email" type="email" value={this.state.email} onChange={this.handleEmailChange}/>
                    <input className="password-input" placeholder="Password" type="password" value={this.state.password} onChange={this.handlePasswordChange}/>
                    <button type="button" onClick={this.handleSubmit}>Submit</button>
                </div>
            </div>
        )
    }
}