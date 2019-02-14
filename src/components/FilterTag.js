import React, { Component } from 'react';

class FilterTag extends Component {

  render() {
    return (
      <div className="tag tag-filter">
        <input type="checkbox" onChange={this.props.handleCheckboxChange} name={this.props.label} checked={this.props.checked} />
        <label>
          {this.props.label}
        </label>
        <i className="fa fa-plus"></i>
        <i className="fa fa-check"></i> 
      </div>
    );
  }
}

export default FilterTag;
