// SingleWorkingHoursEditing.js

import React, { Component } from 'react';
import { ReactComponent as AddIcon } from '../icons/plus-circle.svg'
import Pencil from '../icons/pencil.svg'
import SaveIcon from '../icons/check2-circle.svg'
import Trash from '../icons/trash.svg'

export default class SingleWorkingHoursEditing extends Component {
  f = null
  constructor(props) {
    super(props)

    let locale = "locale" in props ? props.locale : 'nn'
    this.f = Intl.DateTimeFormat(locale, {hour: 'numeric', minute: 'numeric'})

    this.state = {
      from: props.from,
      to: props.to,
      error: false,
      validated: undefined
    }
    this.handleInputFrom = this.handleInputFrom.bind(this)
    this.handleInputTo = this.handleInputTo.bind(this)
    this.save = this.save.bind(this)
    this.delete = this.delete.bind(this)
  }

  handleInputFrom(event) {
    this.setState({from: event.target.value})
  }

  handleInputTo(event) {
    this.setState({to: event.target.value})
  }

  validate(timegroup) {
    if (String(timegroup).length < 5) {
      timegroup = '0' + timegroup;
    }
    let date = new Date(`1970-01-01T${timegroup}:00`);
    return !isNaN(date/1000);
  }

  save() {
    let validated = (this.validate(this.state.from) ? 1 : 0) + (this.validate(this.state.to) ? 2 : 0)
    this.setState({
      validated: validated
    })
    if (validated < 3) {
      this.setState({error: true})
      return
    }
    this.props.completion(this.state.from, this.state.to)
  }

  delete() {
    this.props.deleteCompletion()
  }

  render() {
    let classnames = [1, 2].map(x => {
      let retValue = null
      if (this.state.validated === undefined) {
        retValue = "form-control"
      } else {
        retValue = "form-control " + ((x & this.state.validated) === x ? "is-valid" : "is-invalid")
      }
      console.log(retValue)
      return retValue
    })

    return <form>
      <input
        className={classnames[0]}
        key="input-from"
        type="text"
        style={{width: "4em"}}
        value={this.state.from}
        onChange={this.handleInputFrom} />
      <br key="input-break-1"/>
      <input
        className={classnames[1]}
        type="text"
        style={{width: "4em"}}
        value={this.state.to}
        onChange={this.handleInputTo} />
      <br key="input-break-2"/>
      <img src={Trash} onClick={() => { this.delete() }} />
      <img
        key="save-icon"
        src={SaveIcon}
        onClick={() => { this.save() }} />
    </form>
  }
}

/* 13. januar 12:00 Propedis; 10:20 foniatra. */
