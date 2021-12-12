import React, { Component } from 'react';

export default class WeekdaysRow extends Component {
  f = null

  constructor(props) {
    super(props)
    let locale = "locale" in props ? props.locale : 'nn'
    this.f = Intl.DateTimeFormat(locale, {weekday: 'short', day: 'numeric', month: 'numeric'})
  }

  render() {
    return this.props.dates.map(x => 
      <th
        key={x.toISOString()}
        style={{width: "9em"}}>{this.f.format(x)}
      </th>
    )
  }
}
