import Autosuggest from 'react-autosuggest';

import './Autosuggestion.css';

import React, { Component } from 'react';

function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSuggestions(suggestData, value) {
  const escapedValue = escapeRegexCharacters(value.trim());
  
  if (escapedValue === '' || suggestData.length === 0) {
    return [];
  }

  const regex = new RegExp(escapedValue, 'i');
  return suggestData.filter(data => regex.test(data));
}

function shouldRenderSuggestions(value) {
  return value.trim().length > 1;
}

function getSuggestionValue(suggestion) {
  console.log(suggestion);
  return suggestion;
}

function renderSuggestion(suggestion) {
  return <span>{suggestion}</span>;
}

class Autosuggestion extends Component {

  constructor() {
    super();

    this.state = {
      suggestions: [],
    };

    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
  }
  
  onSuggestionsFetchRequested = ({ value }) => {
    let data = this.props.data;
    this.setState({
      suggestions: getSuggestions(data, value)
    });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  render() {
    const { suggestions } = this.state;
    const inputProps = {
      placeholder: "Look up company or job title..",
      value: this.props.value,
      onChange: this.props.onInputChange
    };

    return (
      <Autosuggest 
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        shouldRenderSuggestions={shouldRenderSuggestions}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps} />
    );
  }
}

export default Autosuggestion;
