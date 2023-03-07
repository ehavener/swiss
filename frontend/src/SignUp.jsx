import { Component } from "react";
import './SignUp.css'

export default class SignUp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            confirmPassword: '',
            emailValid: false,
            passwordValid: false,
            passwordsMatch: false,
            showErrors: false
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(this);
        this.handleSignInButtonClick = this.handleSignInButtonClick.bind(this);
    }

    handleEmailChange(event) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        this.setState({
            email: event.target.value,
            emailValid: emailRegex.test(event.target.value)
        });
    }

    handlePasswordChange(event) {
        this.setState({
            password: event.target.value,
            passwordValid: event.target.value.length >= 8
        });
    }

    handleConfirmPasswordChange(event) {
        this.setState({
            confirmPassword: event.target.value,
            passwordsMatch: event.target.value === this.state.password
        });
    }

    async handleSubmit(event) {
        this.setState({
            ...this.state,
            showErrors: true,
        });

        if (this.state.emailValid && this.state.passwordValid && this.state.passwordsMatch) {
            const url = "http://127.0.0.1:8000/sign-up"
            const formData = new FormData();
            formData.set("username", this.state.email)
            formData.set("password", this.state.password)
            try {
                const response = await fetch(url, {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: this.state.email,
                        password: this.state.password
                    })
                })
                const data = await response.json();
                this.setState({ ...this.state, bearer: data['access_token'] })
                localStorage.setItem("ot_access_token", data['access_token']);
                window.location.replace(`${window.location.origin}/`);
                console.log("inside try block", data);
            } catch (error) {
                console.log('There was an error', error);
            }
        }
    }

    handleSignInButtonClick() {
        window.location.replace(`${window.location.origin}/sign-in`);
    }

    render() {
        return(
            <div>
                <nav className="sign-in-nav">
                    <button type="button" onClick={this.handleSignInButtonClick}>
                    Sign In</button>
                </nav>
                <div className="sign-in-container">
                    <p>Sign up</p>
                    <input className="email-input" placeholder="Email" type="email"
                           value={this.state.email} onChange={this.handleEmailChange}/>
                    {this.state.showErrors && !this.state.emailValid && (<p>Email is invalid</p>)}
                    <input className="password-input" placeholder="Password" type="password"
                           value={this.state.password} onChange={this.handlePasswordChange}/>
                    {this.state.showErrors && !this.state.passwordValid && (<p>Password is invalid</p>)}
                    <input className="confirm-password-input" placeholder="Confirm Password" type="password"
                           value={this.state.confirmPassword} onChange={this.handleConfirmPasswordChange}/>
                    {this.state.showErrors && !this.state.passwordsMatch && (<p>Passwords must match</p>)}
                    <button type="button" onClick={this.handleSubmit}>
                        Submit
                    </button>
                </div>
            </div>
        )
    }
}