import React, { Component } from 'react';

import './Tag.css';

class Tag extends Component {

  render() {
    return (
      <div className="tag tag-plain">
        <label>
          {this.props.label}
        </label>
      </div>
    );
  }
}

export default Tag;
