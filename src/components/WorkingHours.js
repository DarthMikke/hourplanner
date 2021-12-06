import React, { Component } from 'react';
import { ReactComponent as AddIcon } from '../icons/plus-circle.svg'
import Pencil from '../icons/pencil.svg'
import Trash from '../icons/trash.svg'

import SingleWorkingHoursEditing from '../components/SingleWorkingHoursEditing.js'

class WorkingHours extends Component {
  viewmodel = null
  f = null

  constructor(props) {
    super(props)
    this.viewmodels = props.viewmodels

    this.viewmodels.duration = props.viewmodels
      .map(x => (x.to - x.from)/1000/3600)
      .reduce((a, b) => a + b, 0)

    let locale = "locale" in props ? props.locale : 'nn'
    this.f = Intl.DateTimeFormat(locale, {hour: 'numeric', minute: 'numeric'})
    this.state = {
      editing: false,
      showButtons: false,
      from: undefined,
      to: undefined
    }

    this.create = this.create.bind(this)
    this.edit = this.edit.bind(this)
    this.save = this.save.bind(this)
    this.delete = this.delete.bind(this)
    this.handleInputFrom = this.handleInputFrom.bind(this)
    this.handleInputTo = this.handleInputTo.bind(this)
  }

  create() {
    let from = new Date((this.props.day/1000 + 8*3600)*1000)
    let to = new Date((this.props.day/1000 + 16*3600)*1000)
    this.viewmodels.push({
      employee_id: this.props.employee_id,
      workhour_id: undefined,
      from: from,
      to: to,
      duration: (to - from)/1000/3600 // TODO: Forhandsinnstilte standardarbeidstider
    })
    this.setState({editing: undefined})

    // TODO: Asynkront: send API-førespurnad og oppdater workhour_id.
  }

  edit(wh_id) {
    this.setState({
      editing: wh_id,
      from: this.f.format(this.viewmodels.filter(x => x.workhour_id === wh_id)[0].from),
      to: this.f.format(this.viewmodels.filter(x => x.workhour_id === wh_id)[0].to)
    })
  }

  save(from, to) {
    let wh_id = this.state.editing
    /* TODO:
      Oppdater viewmodels,
      send API-førespurnad,
      oppdater viewmodels med data frå serveren.
     */
    this.setState({editing: false})
  }

  delete(wh_id) {
    // TODO
  }

  handleInputFrom(event) {
    this.setState({from: event.target.value})
  }

  handleInputTo(event) {
    this.setState({to: event.target.value})
  }

  render() {
    let divContent = this.viewmodels.map(x => {
      let returnContent = null
      if (this.state.editing === x.workhour_id) {
        console.log(`Dette elementet har id ${x.workhour_id}. Redigerer no ${this.state.editing}.`)
        returnContent = [
          <SingleWorkingHoursEditing
            key={`single-working-hours-${this.props.day}`}
            from={this.state.from}
            to={this.state.to}
            completion={(from, to) => {this.save(from, to)}}
          />
        ]
      } else {
        returnContent = [
          <span>frå {this.f.format(x.from)}</span>,
          this.state.showButtons ? 
            <span className="badge">
              <img
                onClick={() => { this.edit(x.workhour_id) }}
                src={Pencil} />
            </span> : null
          ,
          <br/>,
          <span>til {this.f.format(x.to)}</span>
        ]
      }
      return <div className="border-bottom text-center align-items-center">
        {returnContent}
      </div>
    })

    let addButton = <button
      type="button"
      onClick={() => this.create()}
      className="rounded-pill btn btn-secondary"><AddIcon /></button>

    let classes = ["hiding-button", "d-flex", "justify-content-center", "align-items-center"]
    classes.push(divContent.length === 0 ? "p-3" : "p-1")
    classes.push(this.state.showButtons ? null : "hide")

    divContent.push(<div className={classes.join(" ")}>{addButton}</div>)

    return <td
      style={{width: "8.5em"}}
      onMouseEnter={() => {
          if (this.state.editing != false) { return } 
          this.setState({showButtons: true});
          // console.log(`In (${this.state.showButtons})`)
        }
      }
      onMouseLeave={() => {
          if (this.state.editing != false) { return } 
          this.setState({showButtons: false});
          // console.log(`Out (${this.state.showButtons})`)
        }
      }
      key={`employee-row-cell-${this.viewmodels.count > 0 ? this.viewmodels[0].from : Math.floor(Math.random() * 1000)}`}>
      <div className="flex-row border rounded-2 p-0">
        {divContent}
      </div>
    </td>
      // TODO: Knappar for å leggje til/endre/fjerne planlagte timar
  }
}

export default WorkingHours;
