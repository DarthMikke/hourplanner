import React, { Component } from 'react';
import { ReactComponent as AddIcon } from '../icons/plus-circle.svg';
import Pencil from '../icons/pencil.svg';
import Trash from '../icons/trash.svg';
import { ReactComponent as ErrorIcon } from '../icons/exclamation-triangle-fill.svg';
import { ReactComponent as WaitingIcon } from '../icons/cloud-arrow-up.svg';
import getCookie from '../getcookie.js';

import EditingSingleSchedule from '../components/EditingSingleSchedule.js';

class Schedule extends Component {
  viewmodel = null
  f = null

  constructor(props) {
    super(props)
    if (props.viewmodels.length >= 1) {
      console.log(`Viewmodels on ${props.viewmodels[0].from.toISOString()}`)
      console.log(props.viewmodels)
    }

    /*this.viewmodels.duration = props.viewmodels
      .map(x => (x.to - x.from)/1000/3600)
      .reduce((a, b) => a + b, 0)*/

    let locale = "locale" in props ? props.locale : 'nn'
    this.f = Intl.DateTimeFormat(locale, {hour: 'numeric', minute: 'numeric'})
    this.state = {
      editing: false,
      error: false,
      waiting: false,
      waiting_to_delete: false,
      showButtons: false,
      viewmodels: props.viewmodels,
      from: undefined,
      to: undefined
    }

    this.create = this.create.bind(this)
    this.edit = this.edit.bind(this)
    this.save = this.save.bind(this)
    this.delete = this.delete.bind(this)
    /*this.handleInputFrom = this.handleInputFrom.bind(this)
    this.handleInputTo = this.handleInputTo.bind(this)*/
  }

  create() {
    let from = new Date((this.props.day/1000 + 8*3600)*1000)
    let to = new Date((this.props.day/1000 + 16*3600)*1000)
    let new_viewmodels = this.state.viewmodels
    new_viewmodels.push({
      employee: this.props.employee_id,
      division: this.props.division.division_id,
      schedule_id: -1,
      from: from,
      to: to,
      duration: (to - from)/1000/3600 // TODO: Forhandsinnstilte standardarbeidstider
    })
    this.setState({
      editing: -1,
      viewmodels: new_viewmodels,
    })
  }

  edit(wh_id) {
    console.log(`Editing ${wh_id}.`);
    this.setState({
      editing: wh_id,
      from: this.f.format(this.state.viewmodels.filter(x => x.schedule_id === wh_id)[0].from),
      to: this.f.format(this.state.viewmodels.filter(x => x.schedule_id === wh_id)[0].to)
    })
  }

  save(from, to) {
    // Oppdater viewmodels
    let wh_id = this.state.editing;
    let index = this.state.viewmodels.findIndex(x => {return x.schedule_id === wh_id})
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
    let new_viewmodels = this.state.viewmodels
    console.log(wh_id, index, new_viewmodels);
    new_viewmodels[index].from = newFrom;
    new_viewmodels[index].to = newTo;

    // Avslutt redigering
    this.setState({
      waiting: wh_id,
      editing: false,
      viewmodels: new_viewmodels,
    });

    // Send API-førespurnad
    let formData = new FormData();
    let viewmodel_to_form = {
      schedule_id: new_viewmodels[index].schedule_id,
      employee: new_viewmodels[index].employee,
      division: new_viewmodels[index].division,
      from: new_viewmodels[index].from.toISOString(),
      to: new_viewmodels[index].to.toISOString(),
      duration: new_viewmodels[index].duration
    }

    console.log(viewmodel_to_form);
    for (let x in viewmodel_to_form) {
      if (x == "schedule_id" && wh_id === -1) {
        continue
      }
      console.log(x, viewmodel_to_form[x])
      formData.append(x, viewmodel_to_form[x])
    }

    // TODO: Different API endpoints for creating and adding an entry.
    // Differentiate by `typeof(this.state.editing)` (undefined or int).
    let endpoint = wh_id === -1 ? "api/schedules/create" : "api/schedules/update"
    console.log(`Sender førespurnad til ${endpoint}`)
    fetch(endpoint, { method: "POST", body: formData, headers: {"x-csrftoken": getCookie("csrftoken")} })
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
        if (data.error !== undefined) {
          this.setState({waiting: false, error: wh_id})
          return
        }

        console.log("Received a response (probably a working hours record) from the server:")
        // Oppdater viewmodels med data frå serveren.
        let waitTime = window.location.hostname === "localhost" ? 3000 : 1000
        console.log(`Waiting ${waitTime} ms…`)
        setTimeout(() => {
          let old_schedule = {
            schedule_id: this.state.viewmodels[index].schedule_id,
            employee: this.state.viewmodels[index].employee,
            division: this.state.viewmodels[index].division,
            from: this.state.viewmodels[index].from,
            to: this.state.viewmodels[index].to,
            duration: this.state.viewmodels[index].duration,
          }

          let viewmodels = this.state.viewmodels

          viewmodels[index].schedule_id = data.schedule_id;
          viewmodels[index].from = new Date(data.from);
          viewmodels[index].to = new Date(data.to);

          this.setState({waiting: false, viewmodels: viewmodels});

          /*let new_schedule = {
            schedule_id: data.schedule_id,
            from: data.from,
            to: data.to
          }*/
          this.props.completion(old_schedule, viewmodels[index]);
          /* TODO: completion should take old schedule and new schedule as parameters.
           */
        }, waitTime);
      })
  }

  delete() {
    let wh_id = this.state.editing;
    let index = this.state.viewmodels.findIndex(x => {return x.schedule_id === wh_id})

    this.setState({waiting_to_delete: wh_id, editing: false});

    // Send API-førespurnad
    let formData = new FormData();
    for (let x in this.state.viewmodels[index]) {
      formData.append(x, this.state.viewmodels[index][x])
    }

    let endpoint = 'api/schedules/delete';
    console.log(`Sender førespurnad til ${endpoint}`)
    fetch(endpoint, { method: 'POST', body: formData, headers: {"x-csrftoken": getCookie("csrftoken")} })
      .then(x => {
        if (!x.ok) {
          this.setState({error: wh_id, waiting_to_delete: false});
        }
        console.trace();
        return x.json();
      })
      .catch((e) => {
        this.setState({error: wh_id, waiting_to_delete: false});
        console.trace();
        console.log(e);
        return {error: e}
      })
      .then((data) => {
        if (data.error !== undefined) {
          return
        }
        let removed = this.state.viewmodels.splice(index, 1);
        this.setState({waiting_to_delete: false});
        this.props.completion(removed[0], null);
        console.trace();
      });
  }

  /* handleInputFrom(event) {
    this.setState({from: event.target.value})
  }

  handleInputTo(event) {
    this.setState({to: event.target.value})
  } */

  render() {
    let divContent = this.state.viewmodels.map(x => {
      console.log(x)
      let returnContent = null
      if (this.state.editing === x.schedule_id) {
        returnContent = [
          <EditingSingleSchedule
            key={`single-schedule-${this.props.day}`}
            from={this.state.from}
            to={this.state.to}
            completion={(from, to) => {this.save(from, to)}}
            deleteCompletion={() => {this.delete()}}
          />
        ]
      } else {
        let displayBadge = false
        let badgeContent = null
        if (this.state.error === x.schedule_id) {
          badgeContent = <ErrorIcon fill='black' key={`error-${x.schedule_id}`} />
          displayBadge = true
          console.log(`${x.schedule_id} støtte på ein feil.`)
        } else if(this.state.waiting === x.schedule_id) {
          badgeContent = <WaitingIcon fill='black' key={`waiting-${x.schedule_id}`} />
          displayBadge = true
          console.log(`${x.schedule_id} ventar på respons.`)
        }
        let badge = displayBadge ? <><br/><span className="badge">{badgeContent}</span></> : null
        returnContent = <>
          <span>frå {this.f.format(x.from)}</span>
          {this.state.showButtons ? 
            <span className="badge">
              <img
                onClick={() => { this.edit(x.schedule_id) }}
                src={Pencil} />
            </span> : null}
          <br/>
          <span>til {this.f.format(x.to)}</span>
          { badge }
        </>
      }
      let classes = ["border-bottom", "text-center", "align-items-center", "py-1"]
      classes.push((this.state.error === x.schedule_id
        || this.state.waiting_to_delete === x.schedule_id)
          ? "waiting-for-deletion"
          : null)
      return <div className={classes.join(" ")}>
        {returnContent}
      </div>
    })

    let addButton = <div ><AddIcon /></div>

    let classes = [
      "hiding-button",
      "button",
      "btn",
      "btn-secondary",
      "d-flex",
      "justify-content-center",
      "align-items-center",
      "border-0",
      "rounded-bottom"
    ]
    classes.push(divContent.length === 0 ? "p-3" : "p-1 rounded-0")
    classes.push(this.state.showButtons ? null : "hide")

    divContent.push(<div
      onClick={() => this.create()} className={classes.join(" ")}>{addButton}</div>)

    return <td
      style={{width: "8.5em"}}
      className="p-1 align-middle"
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
      key={`employee-row-cell-${this.state.viewmodels.length > 0 ? this.state.viewmodels[0].from : Math.floor(Math.random() * 1000)}`}>
      <div className="flex-row border rounded-2 p-0">
        {divContent}
      </div>
    </td>
      // TODO: Knappar for å leggje til/endre/fjerne planlagte timar
  }
}

export default Schedule;
