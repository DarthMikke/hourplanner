import React, { Component } from 'react';
import { ReactComponent as AddIcon } from '../icons/plus-circle.svg';
import Pencil from '../icons/pencil.svg';
import Trash from '../icons/trash.svg';
import { ReactComponent as ErrorIcon } from '../icons/exclamation-triangle-fill.svg';
import { ReactComponent as WaitingIcon } from '../icons/cloud-arrow-up.svg';

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
      error: false,
      waiting: false,
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
    console.log(`Editing ${wh_id}.`);
    this.setState({
      editing: wh_id,
      from: this.f.format(this.viewmodels.filter(x => x.workhour_id === wh_id)[0].from),
      to: this.f.format(this.viewmodels.filter(x => x.workhour_id === wh_id)[0].to)
    })
  }

  save(from, to) {
    // Oppdater viewmodels
    let wh_id = this.state.editing;
    let index = this.viewmodels.findIndex(x => {return x.workhour_id === wh_id})
    let newFrom, newTo;
    newFrom = new Date(
      this.props.day.getFullYear(),
      this.props.day.getMonth(),
      this.props.day.getDate(),
      parseInt(from.substr(0, from.indexOf(':'))),
      parseInt(from.substr(from.indexOf(':') + 1))
    )
    newTo = new Date(
      this.props.day.getFullYear(),
      this.props.day.getMonth(),
      this.props.day.getDate(),
      parseInt(to.substr(0, to.indexOf(':'))),
      parseInt(to.substr(to.indexOf(':') + 1))
    )
    console.log(`${newFrom}–${newTo}`);
    this.viewmodels[index].from = newFrom;
    this.viewmodels[index].to = newTo;

    // Avslutt redigering
    this.setState({
      waiting: wh_id,
      editing: false
    });

    // Send API-førespurnad
    let formData = new FormData();
    for (let x in Object.keys(this.viewmodels[index])
      .filter(x => x != "workhour_id")) {
      formData.append(x, this.viewmodels[index][x])
    }
    fetch("api/records/create", { method: "POST", body: formData })
      .then(response => {
        if (!response.ok) {
          console.log(`Request answered with status ${response.status}.`);
          return {error: response.status}
        }
        console.log(response)
        return response.json()
      })
      .then((data) => {
        console.log(data)
        if (Object.keys(data).find(x => x === "error") !== undefined) {
          this.setState({waiting: false, error: wh_id})
          return
        }

        console.log("Received a response (probably a working hours record) from the server:")
        // Oppdater viewmodels med data frå serveren.
        let waitTime = window.location.hostname === "localhost" ? 3000 : 1000
        console.log(`Waiting ${waitTime} ms…`)
        setTimeout(() => {
          this.viewmodels[index]
            .workhour_id = data.planned_workhour_id;
          this.viewmodels[index].from = new Date(data.from);
          this.viewmodels[index].to = new Date(data.to);

          this.setState({waiting: false})
        }, waitTime);
      })
  }

  delete() {
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
        returnContent = [
          <SingleWorkingHoursEditing
            key={`single-working-hours-${this.props.day}`}
            from={this.state.from}
            to={this.state.to}
            completion={(from, to) => {this.save(from, to)}}
            deleteCompletion={() => {this.delete()}}
          />
        ]
      } else {
        let displayBadge = false
        let badgeContent = null
        if (this.state.error === x.workhour_id) {
          badgeContent = <ErrorIcon fill='black' key={`error-${x.workhour_id}`} />
          displayBadge = true
          console.log(`${x.workhour_id} støtte på ein feil.`)
        } else if(this.state.waiting === x.workhour_id) {
          badgeContent = <WaitingIcon fill='black' key={`waiting-${x.workhour_id}`} />
          displayBadge = true
          console.log(`${x.workhour_id} ventar på respons.`)
        }
        let badge = displayBadge ? <><br/><span className="badge">{badgeContent}</span></> : null
        console.log(displayBadge, badgeContent)
        returnContent = <>
          <span>frå {this.f.format(x.from)}</span>
          {this.state.showButtons ? 
            <span className="badge">
              <img
                onClick={() => { this.edit(x.workhour_id) }}
                src={Pencil} />
            </span> : null}
          <br/>
          <span>til {this.f.format(x.to)}</span>
          { badge }
        </>
      }
      return <div className="border-bottom text-center align-items-center py-2">
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
          if (this.state.editing !== false) { return } 
          this.setState({showButtons: true});
        }
      }
      onMouseLeave={() => {
          if (this.state.editing !== false) { return } 
          this.setState({showButtons: false});
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
