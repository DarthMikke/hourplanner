import React, { Component } from 'react';
import DateRangePicker from './DateRangePicker.js';
import Schedule from './Schedule.js';
import WeekdaysRow from './WeekdaysRow.js';
import EmployeeRow from './EmployeeRow.js';
import '../App.css';

class WeeklyView extends Component {
  f = Intl.DateTimeFormat('nn', {weekday: 'short', day: 'numeric', month: 'numeric'})
  f2 = Intl.DateTimeFormat('nn', {hour: 'numeric', minute: 'numeric'})
  f3 = Intl.DateTimeFormat('nn', {day: 'numeric', month: 'numeric'})
  f4 = Intl.DateTimeFormat('nn', {year: 'numeric', month: '2-digit', day: '2-digit'})
  constructor(props) {
    console.log("WeeklyView.constructor()")
    super(props)

    // this.f = Intl.DateTimeFormat('nn', {weekday: 'short', day: 'numeric', month: 'numeric'})

    let today = this.f4.formatToParts(new Date())
    let year = today.find(x => x.type === "year").value
    let month = today.find(x => x.type === "month").value
    let day = today.find(x => x.type === "day").value

    let from = new Date(`${year}-${month}-${day}`)
    let to = new Date((from/1000 + 24*3600*6)*1000)
    this.state = {
      loaded: false,
      from: from,
      to: to,
      company: undefined,
      divisions: [],
      dates: [],
      employees: [],
      schedules: [],
      staff: false
    }
    this.loadData = this.loadData.bind(this)
    this.updateSchedule = this.updateSchedule.bind(this)
  }

  componentDidMount() {
    // Load user data
    fetch('api/me')
      .then(response => response.json())
      .then(data => {
        console.log(data)
        this.setState({
          staff: data.employee.staff,
          company: data.company.company_id
        })

        // Load schedules
        // TODO: fromString, toString
        this.loadData(this.state.from, this.state.to) // TODO: Load schedules after loading user data.
      })

  }

  loadData(from, to) {
    var startDate = new Date(from)
    var endDate = new Date(to)
    let startTimestamp = Math.floor(startDate/1000)*1000
    var dates = []
    for(var i=0; i<=6; i++) {
      dates.push(new Date(startTimestamp + i*24*3600*1000))
    }
    console.log(`Dates: ${dates}`)

    let company = this.state.company == undefined ? null : this.state.company
    // TODO: Use ISO formatted datetime strings.
    fetch(`api/schedules/list?company=${company}&from=${startDate.toISOString()}&to=${endDate.toISOString()}`)
      .then(response => response.json())
      .then(x => {
        console.log(x)
        this.setState({
          from: from,
          to: to,
          dates: dates,
          //company: x.company,
          divisions: x.divisions,
          schedules: x.schedules, // TODO: Sorter etter tid
          employees: x.employees, // TODO: Sorter alfabetisk
          loaded: true
        })
        return true
      })

    return
  }

  updateSchedule(from, to) {
    // This method, when used for editing a schedule, only works
    // when `from` and `to` schedule have same schedule id.
    console.log("Changing from", from, "to", to);

    let all_schedules = this.state.schedules;
    if (from.schedule_id === -1) {
      // Create schedule
      all_schedules.push(to);
    } else {
      let index = this.state.schedules.findIndex(x => {return x.schedule_id === from.schedule_id})
      console.log(`Found schedule with id ${from.schedule_id} at index ${index}.`)
      if(to.schedule_id === null) {
        // Delete schedule
        all_schedules.splice(index, 1);
      } else {
        // Update schedule
        let index = this.state.schedules.findIndex(x => {return x.schedule_id === from.schedule_id})
        let old_schedule = this.state.schedules[index];
        let new_schedule = this.state.schedules[index];
        console.trace()
        console.log(from.schedule_id, to, new_schedule)
        new_schedule.schedule_id = to.schedule_id
        new_schedule.from = to.from
        new_schedule.to = to.to
        all_schedules[index] = new_schedule;
      }
    }

    this.setState({
      schedules: all_schedules
    })
    return
  }

  render() {
    let firstDay = this.f3.format(this.state.from)
    let lastDay = this.f3.format(this.state.to)

    let headers = <WeekdaysRow dates={this.state.dates} />
    /*let divisions = this.state.divisions.map(division => {

    })*/
    let employees = this.state.employees.map(employee => {
      return <EmployeeRow
       dates={this.state.dates}
       division={this.state.divisions[0]}
       plannedWorkhours={this.state.schedules}
       employee={employee}
       completion={(old_schedule, new_schedule) => {this.updateSchedule(old_schedule, new_schedule)}} />
    })
    let totals_row = this.state.dates.map((date) => {
      let next_day = new Date(((date/1000)+24*3600)*1000)
      let this_day_total = this.state.schedules
        .map((schedule) => {
          let from_date = new Date(schedule.from)
          let to_date = new Date(schedule.to)
          return {
            from: from_date,
            to: to_date,
            duration: (to_date - from_date)/1000/3600
          }
        })
        .filter((schedule) => {
          let from_date = new Date(schedule.from)
          let i1 = date <= from_date
          let i2 = from_date < next_day
          return i1 && i2
        })
        .map((x) => x.duration)
        .reduce((a, b) => (a + b), 0)

      if (this_day_total == 0) {
        return <td className="text-muted">–</td>
      }
      return <td>{this_day_total} t</td>
    })

    if (!this.state.loaded) {
      return <div className="WeeklyView">Loading...</div>
    }

    return (
      <div className="WeeklyView">
        <h1>{this.state.company.name}</h1>
        <DateRangePicker from={this.state.from} to={this.state.to} completion={(from, to) => this.loadData(from, to)} />
        <div key="table" className="table-responsive">
          <table className="table small">
            <thead>
              <tr>
                <th scope="col">Tilsett</th>
                {headers}
                <th scope="col">Totalt</th>
              </tr>
            </thead>
            <tbody>
              {employees}
              {/* TODO: Totalrad */}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                {totals_row}
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* TODO: Statusbar */}
      </div>
    );
  }
}

/*function plannedDay(props) {
  return [
  <td>
    {props.planned_workhours.map(x => `Frå: ${x.from}<br/>Til: ${x.to}.`)}
  </td>,
  <td>{props.planned_workhours.reduce((a, b) => a + b)}</td>
  ]
}*/

export default WeeklyView;
