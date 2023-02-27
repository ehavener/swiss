import { Component } from "react";

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
        this.setState({prompt: event.target.value});
    }

    handleSubmit(event) {
        setTimeout(() => {
            this.setState({...this.state, output: "Hi!"})
        }, 1000)
        event.preventDefault();
    }

    render() {
        return (
            <div>
                <h1>Toolformer</h1>
                <input placeholder="Enter a prompt" type="text"
                       value={this.state.prompt} onChange={this.handlePromptChange}/>
                <button type="submit" onClick={this.handleSubmit}>Submit</button>
                <p>{this.state.output}</p>
            </div>
        );
    }
}