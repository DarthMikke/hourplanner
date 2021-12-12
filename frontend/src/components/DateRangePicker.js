// DateRangePicker.js

import React, { Component } from 'react';
import { ReactComponent as PrevWeekIcon } from '../icons/chevron-double-left.svg'
import { ReactComponent as PrevDayIcon } from '../icons/chevron-left.svg'
import { ReactComponent as NextDayIcon } from '../icons/chevron-right.svg'
import { ReactComponent as NextWeekIcon } from '../icons/chevron-double-right.svg'


export default class DateRangePicker extends Component {
  f = null
  constructor(props) {
    super(props)
    let from = new Date(props.from)
    let to = new Date(props.to)
    this.state = {
      from: from,
      to: to
    }

    this.f = Intl.DateTimeFormat('nn', {day: 'numeric', month: 'numeric'})

    this.prevWeek = this.prevWeek.bind(this)
    this.prevDay = this.prevDay.bind(this)
    this.nextDay = this.nextDay.bind(this)
    this.nextWeek = this.nextWeek.bind(this)
    this.offset = this.offset.bind(this)
  }

  offset(n) {
    let newFrom = new Date(((this.state.from/1000)+3600*24*n)*1000)
    let newTo = new Date(((this.state.to/1000)+3600*24*n)*1000)
    this.setState({
      from: newFrom,
      to: newTo
    })
    this.props.completion(newFrom, newTo)
  }

  prevWeek() {
    this.offset(-7)
  }

  prevDay() {
    this.offset(-1)
  }

  nextDay() {
    this.offset(1)
  }

  nextWeek() {
    this.offset(7)
  }

  render() {
    return <div className="btn-group">
      <button type="button" class="btn btn-primary" onClick={this.prevWeek}><PrevWeekIcon /></button>
      <button type="button" class="btn btn-primary" onClick={this.prevDay}><PrevDayIcon /></button>
      <button type="button" class="btn btn-outline-primary">{this.f.format(this.state.from)}–{this.f.format(this.state.to)}</button>
      <button type="button" class="btn btn-primary" onClick={this.nextDay}><NextDayIcon /></button>
      <button type="button" class="btn btn-primary" onClick={this.nextWeek}><NextWeekIcon /></button>
    </div>
  }
}